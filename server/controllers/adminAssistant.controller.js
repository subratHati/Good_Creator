// controllers/adminAssistant.controller.js
//
// Admin "AI Messages": a READ-ONLY window into what the AI assistant says to
// users and what they answer. Nothing in here writes anything - it does not even
// mark messages as read - and there is no route for sending a message.
const AssistantConversation = require('../models/AssistantConversation');
const AssistantMessage = require('../models/AssistantMessage');
const User = require('../models/User');
const Creator = require('../models/Creator');
const Brand = require('../models/Brand');

const DAY = 24 * 60 * 60 * 1000;
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

// name, email, photo and profile link for a set of users
const describeUsers = async (userIds) => {
  const [users, creators, brands] = await Promise.all([
    User.find({ _id: { $in: userIds } }).select('_id email role').lean(),
    Creator.find({ userId: { $in: userIds } }).select('_id userId name profilePhoto').lean(),
    Brand.find({ userId: { $in: userIds } }).select('_id userId brandName logo').lean(),
  ]);
  const byUser = {};
  users.forEach((u) => { byUser[String(u._id)] = { email: u.email, role: u.role, name: u.email, photo: null, profilePath: null }; });
  creators.forEach((c) => {
    const d = byUser[String(c.userId)];
    if (d) { d.name = c.name || d.name; d.photo = c.profilePhoto || null; d.profilePath = `/creator/${c._id}`; }
  });
  brands.forEach((b) => {
    const d = byUser[String(b.userId)];
    if (d) { d.name = b.brandName || d.name; d.photo = b.logo || null; d.profilePath = `/brand/${b._id}`; }
  });
  return (userId) => byUser[String(userId)] || { email: '', role: '', name: 'Deleted user', photo: null, profilePath: null };
};

const snippet = (text, n = 140) => {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n)}…` : t;
};

// ─── GET /api/admin-assistant/list?tab=talked|silent&role=&search=&page=&limit= ──
//   talked  = users who have written to the AI at least once (most recent first)
//   silent  = users the AI has messaged but who never wrote back
const getAssistantChatList = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 25));
    const skip = (page - 1) * limit;
    const tab = req.query.tab === 'silent' ? 'silent' : 'talked';
    const role = ['creator', 'brand'].includes(req.query.role) ? req.query.role : null;
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';

    // role / search narrow the set of conversations
    const convFilter = {};
    if (role) convFilter.userRole = role;
    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      const [byEmail, byCreator, byBrand] = await Promise.all([
        User.find({ email: rx, role: { $in: ['creator', 'brand'] } }).select('_id').lean(),
        Creator.find({ name: rx }).select('userId').lean(),
        Brand.find({ brandName: rx }).select('userId').lean(),
      ]);
      convFilter.userId = { $in: [...byEmail.map((u) => u._id), ...byCreator.map((c) => c.userId), ...byBrand.map((b) => b.userId)] };
    }
    const restricted = Object.keys(convFilter).length > 0;
    const allowedIds = restricted
      ? (await AssistantConversation.find(convFilter).select('_id').lean()).map((c) => c._id)
      : null;

    let rows = [];
    let total = 0;

    if (tab === 'talked') {
      const match = { role: 'user', ...(allowedIds ? { conversationId: { $in: allowedIds } } : {}) };
      const [grouped, counted] = await Promise.all([
        AssistantMessage.aggregate([
          { $match: match },
          { $sort: { createdAt: 1 } },
          { $group: { _id: '$conversationId', userMessages: { $sum: 1 }, lastUserAt: { $max: '$createdAt' }, lastUserText: { $last: '$text' } } },
          { $sort: { lastUserAt: -1 } },
          { $skip: skip },
          { $limit: limit },
        ]),
        AssistantMessage.aggregate([{ $match: match }, { $group: { _id: '$conversationId' } }, { $count: 'n' }]),
      ]);
      total = (counted[0] && counted[0].n) || 0;
      const convs = await AssistantConversation.find({ _id: { $in: grouped.map((g) => g._id) } }).lean();
      const convById = {}; convs.forEach((c) => { convById[String(c._id)] = c; });
      rows = grouped.map((g) => ({ g, conv: convById[String(g._id)] })).filter((r) => r.conv);
    } else {
      const repliedIds = await AssistantMessage.distinct('conversationId', { role: 'user' });
      const q = { ...convFilter, _id: { $nin: repliedIds }, lastCheckinAt: { $ne: null } };
      const [convs, n] = await Promise.all([
        AssistantConversation.find(q).sort({ lastCheckinAt: -1 }).skip(skip).limit(limit).lean(),
        AssistantConversation.countDocuments(q),
      ]);
      total = n;
      rows = convs.map((conv) => ({ g: null, conv }));
    }

    const describe = await describeUsers(rows.map((r) => r.conv.userId));
    const list = rows.map(({ g, conv }) => {
      const u = describe(conv.userId);
      return {
        conversationId: String(conv._id),
        userId: String(conv.userId),
        role: conv.userRole,
        name: u.name,
        email: u.email,
        photo: u.photo,
        userMessages: g ? g.userMessages : 0,
        lastUserAt: g ? g.lastUserAt : null,
        lastUserText: g ? snippet(g.lastUserText) : '',
        lastMessage: snippet(conv.lastMessage),
        lastMessageAt: conv.lastMessageAt,
        lastCheckinAt: conv.lastCheckinAt,
        unopened: conv.unreadByUser || 0,
        checkinsEnabled: conv.checkinsEnabled !== false,
      };
    });

    // overall numbers for the top of the page (first page only)
    let stats = null;
    if (page === 1) {
      const week = new Date(Date.now() - 7 * DAY);
      const [talkedUsers, userMessagesTotal, userMessages7d, checkins7d] = await Promise.all([
        AssistantMessage.distinct('conversationId', { role: 'user' }).then((a) => a.length),
        AssistantMessage.countDocuments({ role: 'user' }),
        AssistantMessage.countDocuments({ role: 'user', createdAt: { $gte: week } }),
        AssistantMessage.countDocuments({ proactive: true, createdAt: { $gte: week } }),
      ]);
      stats = { talkedUsers, userMessagesTotal, userMessages7d, checkins7d };
    }

    res.json({ list, stats, pagination: { page, limit, total, hasMore: skip + list.length < total } });
  } catch (error) {
    console.error('[ADMIN-AI] list error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET /api/admin-assistant/:conversationId?before=<date>&limit=100 ────────────
const getAssistantChat = async (req, res) => {
  try {
    const { conversationId } = req.params;
    if (!OBJECT_ID.test(conversationId)) return res.status(400).json({ message: 'Invalid conversation id' });
    const conversation = await AssistantConversation.findById(conversationId).lean();
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 100));
    const filter = { conversationId: conversation._id };
    if (req.query.before) {
      const before = new Date(req.query.before);
      if (!Number.isNaN(before.getTime())) filter.createdAt = { $lt: before };
    }
    const found = await AssistantMessage.find(filter).sort({ createdAt: -1 }).limit(limit + 1).lean();
    const hasMore = found.length > limit;
    const messages = found.slice(0, limit).reverse().map((m) => ({
      _id: String(m._id),
      role: m.role,
      text: m.text,
      createdAt: m.createdAt,
      proactive: !!m.proactive,
      checkinTopic: m.checkinTopic || '',
      // just a short description of any result cards the AI showed
      cards: (m.cards || []).slice(0, 10).map((c) => ({
        type: c && c.openingId ? 'campaign' : 'creator',
        title: (c && (c.title || c.name)) || '',
      })),
    }));

    const describe = await describeUsers([conversation.userId]);
    const u = describe(conversation.userId);
    res.json({
      conversation: {
        _id: String(conversation._id),
        userId: String(conversation.userId),
        role: conversation.userRole,
        name: u.name,
        email: u.email,
        photo: u.photo,
        profilePath: u.profilePath,
        checkinsEnabled: conversation.checkinsEnabled !== false,
        unopened: conversation.unreadByUser || 0,
        startedAt: conversation.createdAt,
      },
      messages,
      hasMore,
    });
  } catch (error) {
    console.error('[ADMIN-AI] chat error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAssistantChatList, getAssistantChat };
