// Replace getAdminChatList in adminChat.controller.js with this.
// (requires at the top of that file already exist: AdminConversation, User, Creator, Brand)
const AdminConversation = require('../models/AdminConversation');
const User = require('../models/User');
const Creator = require('../models/Creator');
const Brand = require('../models/Brand');

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
    const convQuery = roleFilter ? { userRole: roleFilter } : {};

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

module.exports = { getAdminChatList };
