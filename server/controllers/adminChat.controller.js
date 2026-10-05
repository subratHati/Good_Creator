// controllers/adminChat.controller.js
const AdminConversation = require('../models/AdminConversation');
const AdminMessage = require('../models/AdminMessage');
const User = require('../models/User');
const Creator = require('../models/Creator');
const Brand = require('../models/Brand');
const Opening = require('../models/Opening');

// An AdminConversation document is created the moment admin opens someone's
// chat (so there's a room to send into) — but that alone is NOT a conversation.
// It only counts once a message has actually been sent: sendAdminMessage is the
// only place lastMessageBy is ever set. Every list/lookup below filters on this,
// so merely opening a profile never creates an inbox entry or jumps to the top.
const HAS_MESSAGES = { lastMessageBy: { $in: ['admin', 'user'] } };

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ─── GET /api/admin-chat/list?page=1&limit=25&role=creator&search=abc ───────
// Two-phase, database-level pagination:
//   Phase 1 pages through AdminConversation (unread-first, then most recent —
//   both real fields on that collection), so nothing is loaded just to be sorted.
//   Phase 2 starts only once every conversation is exhausted, and pages through
//   users who have never been messaged, newest signup first.
// Search is applied on the server (email / creator name / brand name) so it
// covers every user, not just the ones already loaded in the browser.
const getAdminChatList = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 25);
    const roleFilter = ['creator', 'brand'].includes(req.query.role) ? req.query.role : null;
    const search = (req.query.search || '').trim();

    const userMatch = roleFilter ? { role: roleFilter } : { role: { $in: ['creator', 'brand'] } };
    const convQuery = { ...(roleFilter ? { userRole: roleFilter } : {}), ...HAS_MESSAGES };

    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      const [byEmail, byCreator, byBrand] = await Promise.all([
        User.find({ ...userMatch, email: rx }).select('_id').lean(),
        Creator.find({ name: rx }).select('userId').lean(),
        Brand.find({ brandName: rx }).select('userId').lean(),
      ]);
      const candidateIds = [
        ...byEmail.map((u) => u._id),
        ...byCreator.map((c) => c.userId),
        ...byBrand.map((b) => b.userId),
      ];
      // re-apply the role filter to the candidate set
      const matched = await User.find({ ...userMatch, _id: { $in: candidateIds } }).select('_id').lean();
      const matchedIds = matched.map((u) => u._id);
      userMatch._id = { $in: matchedIds };
      convQuery.userId = { $in: matchedIds };
    }

    const [totalUsers, totalConversations] = await Promise.all([
      User.countDocuments(userMatch),
      AdminConversation.countDocuments(convQuery),
    ]);

    const skip = (page - 1) * limit;
    let list = [];

    if (skip < totalConversations) {
      const conversations = await AdminConversation.find(convQuery)
        .sort({ unreadByAdmin: -1, lastMessageAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const userIds = conversations.map((c) => c.userId);
      const [users, creators, brands] = await Promise.all([
        User.find({ _id: { $in: userIds } }).select('_id email').lean(),
        Creator.find({ userId: { $in: userIds } }).select('userId name profilePhoto').lean(),
        Brand.find({ userId: { $in: userIds } }).select('userId brandName logo').lean(),
      ]);
      const userById = {}; users.forEach((u) => { userById[u._id.toString()] = u; });
      const creatorByUserId = {}; creators.forEach((c) => { creatorByUserId[c.userId.toString()] = c; });
      const brandByUserId = {}; brands.forEach((b) => { brandByUserId[b.userId.toString()] = b; });

      list = conversations.map((c) => {
        const uid = c.userId.toString();
        const profile = c.userRole === 'creator' ? creatorByUserId[uid] : brandByUserId[uid];
        return {
          userId: c.userId,
          role: c.userRole,
          email: userById[uid]?.email || '',
          name: c.userRole === 'creator' ? (profile?.name || 'Unnamed creator') : (profile?.brandName || 'Unnamed brand'),
          photo: c.userRole === 'creator' ? profile?.profilePhoto : profile?.logo,
          hasConversation: true,
          conversationId: c._id,
          lastMessage: c.lastMessage,
          lastMessageAt: c.lastMessageAt,
          unreadByAdmin: c.unreadByAdmin,
        };
      });
    }

    if (list.length < limit) {
      const messaged = await AdminConversation.find(convQuery).select('userId').lean();
      const messagedUserIds = messaged.map((c) => c.userId);
      const phase2Skip = Math.max(0, skip - totalConversations);

      const neverMessaged = await User.find({ ...userMatch, _id: { ...(userMatch._id || {}), $nin: messagedUserIds } })
        .select('_id role email createdAt')
        .sort({ createdAt: -1 })
        .skip(phase2Skip)
        .limit(limit - list.length)
        .lean();

      const ids2 = neverMessaged.map((u) => u._id);
      const [creators2, brands2] = await Promise.all([
        Creator.find({ userId: { $in: ids2 } }).select('userId name profilePhoto').lean(),
        Brand.find({ userId: { $in: ids2 } }).select('userId brandName logo').lean(),
      ]);
      const c2 = {}; creators2.forEach((c) => { c2[c.userId.toString()] = c; });
      const b2 = {}; brands2.forEach((b) => { b2[b.userId.toString()] = b; });

      const extra = neverMessaged.map((u) => {
        const profile = u.role === 'creator' ? c2[u._id.toString()] : b2[u._id.toString()];
        return {
          userId: u._id,
          role: u.role,
          email: u.email,
          name: u.role === 'creator' ? (profile?.name || 'Unnamed creator') : (profile?.brandName || 'Unnamed brand'),
          photo: u.role === 'creator' ? profile?.profilePhoto : profile?.logo,
          hasConversation: false,
          conversationId: null,
          lastMessage: '',
          lastMessageAt: u.createdAt,
          unreadByAdmin: 0,
        };
      });
      list = [...list, ...extra];
    }

    res.json({
      list,
      pagination: { total: totalUsers, page, hasMore: skip + list.length < totalUsers },
    });
  } catch (error) {
    console.error('getAdminChatList error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};


// ─── POST /api/admin-chat/start ──────────────────────────────────────────────
const startAdminConversation = async (req, res) => {
  const { userId } = req.body;
  try {
    const targetUser = await User.findById(userId).select('role');
    if (!targetUser || !['creator', 'brand'].includes(targetUser.role)) {
      return res.status(404).json({ message: 'User not found' });
    }

    let conversation = await AdminConversation.findOne({ userId });
    if (!conversation) {
      conversation = await AdminConversation.create({ userId, userRole: targetUser.role });
    }
    res.json({ conversation });
  } catch (error) {
    console.error('startAdminConversation error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET /api/admin-chat/mine ─────────────────────────────────────────────────
const getMyAdminConversation = async (req, res) => {
  try {
    const conversation = await AdminConversation.findOne({ userId: req.user.id, ...HAS_MESSAGES });
    res.json({ conversation: conversation || null });
  } catch (error) {
    console.error('getMyAdminConversation error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET /api/admin-chat/:conversationId/messages ────────────────────────────
const getAdminMessages = async (req, res) => {
  const { conversationId } = req.params;
  try {
    const conversation = await AdminConversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    const isAdmin = req.user.role === 'admin';
    const isOwner = conversation.userId.toString() === req.user.id;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const messages = await AdminMessage.find({ conversationId }).sort({ createdAt: 1 });

    if (isAdmin) {
      await AdminConversation.findByIdAndUpdate(conversationId, { unreadByAdmin: 0 });
      await AdminMessage.updateMany(
        { conversationId, senderRole: { $ne: 'admin' }, seen: false },
        { seen: true }
      );
    } else {
      await AdminConversation.findByIdAndUpdate(conversationId, { unreadByUser: 0 });
      await AdminMessage.updateMany(
        { conversationId, senderRole: 'admin', seen: false },
        { seen: true }
      );
    }

    res.json({ messages, conversation });
  } catch (error) {
    console.error('getAdminMessages error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── POST /api/admin-chat/:conversationId/messages ───────────────────────────
const sendAdminMessage = async (req, res) => {
  const { conversationId } = req.params;
  const { text, type, creatorIdToShare, openingIdToShare } = req.body;

  try {
    const conversation = await AdminConversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    const isAdmin = req.user.role === 'admin';
    const isOwner = conversation.userId.toString() === req.user.id;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const messageData = {
      conversationId,
      senderId: req.user.id,
      senderRole: isAdmin ? 'admin' : conversation.userRole,
      type: type || 'text',
      text: text || '',
    };

    let lastMessageText = text || '';

    if (type === 'creator_share') {
      if (!isAdmin) return res.status(403).json({ message: 'Only admin can share a creator profile' });
      const creator = await Creator.findById(creatorIdToShare)
        .select('name profilePhoto instagram.followersCount instagram.engagementRate instagram.avgViews');
      if (!creator) return res.status(404).json({ message: 'Creator not found' });
      messageData.creatorShare = {
        creatorId: creator._id,
        name: creator.name,
        profilePhoto: creator.profilePhoto,
        followersCount: creator.instagram?.followersCount || 0,
        engagementRate: creator.instagram?.engagementRate || 0,
        avgViews: creator.instagram?.avgViews || 0,
      };
      lastMessageText = `👤 Shared creator: ${creator.name}`;
    } else if (type === 'campaign_share') {
      if (!isAdmin) return res.status(403).json({ message: 'Only admin can share a campaign' });
      const opening = await Opening.findById(openingIdToShare).populate('brandId', 'brandName logo');
      if (!opening) return res.status(404).json({ message: 'Campaign not found' });
      messageData.campaignShare = {
        openingId: opening._id,
        title: opening.title,
        brandName: opening.brandId?.brandName || 'Brand',
        brandLogo: opening.brandId?.logo || '',
        budgetMin: opening.budgetMin,
        budgetMax: opening.budgetMax,
        isBarter: opening.isBarter,
      };
      lastMessageText = `📋 Shared campaign: ${opening.title}`;
    }

    const message = await AdminMessage.create(messageData);

    const unreadUpdate = isAdmin
      ? { unreadByUser: conversation.unreadByUser + 1 }
      : { unreadByAdmin: conversation.unreadByAdmin + 1 };

    await AdminConversation.findByIdAndUpdate(conversationId, {
      lastMessage: lastMessageText,
      lastMessageAt: new Date(),
      lastMessageBy: isAdmin ? 'admin' : 'user',
      ...unreadUpdate,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`admin_conversation_${conversationId}`).emit('new_admin_message', message);
      const otherUserId = isAdmin ? conversation.userId.toString() : null;
      if (otherUserId) {
        io.to(`user_${otherUserId}`).emit('admin_conversation_updated', {
          conversationId,
          lastMessage: lastMessageText,
          lastMessageAt: new Date(),
        });
      }
      if (!isAdmin) {
        io.to('admin_room').emit('admin_conversation_updated', {
          conversationId,
          lastMessage: lastMessageText,
          lastMessageAt: new Date(),
        });
      }
    }

    res.status(201).json({ message });
  } catch (error) {
    console.error('sendAdminMessage error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET /api/admin-chat/unread-count ────────────────────────────────────────
const getAdminUnreadCount = async (req, res) => {
  try {
    const conversation = await AdminConversation.findOne({ userId: req.user.id }).select('unreadByUser');
    res.json({ unreadCount: conversation?.unreadByUser || 0 });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAdminChatList,
  startAdminConversation,
  getMyAdminConversation,
  getAdminMessages,
  sendAdminMessage,
  getAdminUnreadCount,
};
