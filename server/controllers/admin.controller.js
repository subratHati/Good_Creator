const Creator = require('../models/Creator');
const Brand = require('../models/Brand');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendAdminEmail } = require('../services/email.service');
const sendPushNotification = require('../utils/sendPushNotification');
const { createNotification } = require('./notification.controller');
const { STATUS } = require('../utils/brandVerification');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parsePaging = (req) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  return { page, limit, skip: (page - 1) * limit };
};

// sort=active means "most recently active first". lastActiveAt lives on the
// User record (the auth middleware keeps it fresh), not on Creator/Brand, so
// that order needs a join. Everything else (filters, search, counts) stays
// exactly as it was.
const wantsActiveSort = (req) => req.query.sort === 'active';

const LIST_USER_FIELDS = 'email isActive isEmailVerified createdAt lastActiveAt';

const findListPage = async (Model, query, byActivity, skip, limit) => {
  if (!byActivity) {
    return Model.find(query)
      .select('-instagram.accessToken')
      .populate('userId', LIST_USER_FIELDS)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  // step 1: work out the right order (and the right page) with a join
  // People who have no lastActiveAt saved yet sort last. _id is the tiebreaker
  // so paging never repeats or skips a row.
  const ordered = await Model.aggregate([
    { $match: query },
    { $lookup: { from: User.collection.name, localField: 'userId', foreignField: '_id', as: '_u' } },
    { $addFields: { _lastActive: { $arrayElemAt: ['$_u.lastActiveAt', 0] } } },
    { $sort: { _lastActive: -1, _id: -1 } },
    { $skip: skip },
    { $limit: limit },
    { $project: { _id: 1 } },
  ]);
  const ids = ordered.map((d) => d._id);

  // step 2: load those rows the normal way, then put them back in order
  const docs = await Model.find({ _id: { $in: ids } })
    .select('-instagram.accessToken')
    .populate('userId', LIST_USER_FIELDS)
    .lean();
  const byId = new Map(docs.map((d) => [String(d._id), d]));
  return ids.map((id) => byId.get(String(id))).filter(Boolean);
};

// GET /api/admin/creators?page=1&limit=25&instagramStatus=connected&search=abc
// One page of creators, plus the TRUE total matching the current filters
// (countDocuments, not the page length) and unfiltered totals for both tabs.
// Sorted by createdAt with _id as a tiebreaker: createdAt alone isn't unique,
// and skip/limit over a non-unique sort can repeat or skip rows between pages.
const getAllCreators = async (req, res) => {
  try {
    const { instagramStatus } = req.query;
    const search = (req.query.search || '').trim();
    const { page, limit, skip } = parsePaging(req);

    const query = {};
    if (instagramStatus === 'connected') {
      query['instagram.isConnected'] = true;
    } else if (instagramStatus === 'manual') {
      query['instagram.isManuallyAdded'] = true;
    } else if (instagramStatus === 'none') {
      query['instagram.isConnected'] = false;
      query['instagram.isManuallyAdded'] = false;
    }

    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      // email lives on User, not Creator — resolve matching users first
      const emailMatches = await User.find({ role: 'creator', email: rx }).select('_id').lean();
      query.$or = [
        { name: rx },
        { 'instagram.handle': rx },
        { userId: { $in: emailMatches.map((u) => u._id) } },
      ];
    }

    const [creators, total, overallCreators, overallBrands] = await Promise.all([
      findListPage(Creator, query, wantsActiveSort(req), skip, limit),
      Creator.countDocuments(query),
      Creator.countDocuments({}),
      Brand.countDocuments({}),
    ]);

    res.json({
      creators,
      total,
      pagination: { page, hasMore: skip + creators.length < total },
      overall: { creators: overallCreators, brands: overallBrands },
    });
  } catch (error) {
    console.error('getAllCreators error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/admin/brands?page=1&limit=25&search=abc
const getAllBrands = async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    const { page, limit, skip } = parsePaging(req);

    const query = {};
    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      const emailMatches = await User.find({ role: 'brand', email: rx }).select('_id').lean();
      query.$or = [
        { brandName: rx },
        { 'instagram.handle': rx },
        { userId: { $in: emailMatches.map((u) => u._id) } },
      ];
    }

    const [brands, total, overallCreators, overallBrands] = await Promise.all([
      findListPage(Brand, query, wantsActiveSort(req), skip, limit),
      Brand.countDocuments(query),
      Creator.countDocuments({}),
      Brand.countDocuments({}),
    ]);

    res.json({
      brands,
      total,
      pagination: { page, hasMore: skip + brands.length < total },
      overall: { creators: overallCreators, brands: overallBrands },
    });
  } catch (error) {
    console.error('getAllBrands error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/admin/send-message
// body: { userIds: [ObjectId, ...], channels: ['email', 'inApp'], subject, message, actionPath }
// Sends to one or many users. Each recipient is handled independently —
// one failed email should not stop the rest of the batch from sending.
const sendMessage = async (req, res) => {
  try {
    const { userIds, channels, subject, message, actionPath } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'At least one recipient is required' });
    }
    if (!Array.isArray(channels) || channels.length === 0) {
      return res.status(400).json({ message: 'At least one channel (email or inApp) is required' });
    }
    if (!subject || !subject.trim()) {
      return res.status(400).json({ message: 'Subject is required' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const sendEmail = channels.includes('email');
    const sendInApp = channels.includes('inApp');

    const users = await User.find({ _id: { $in: userIds } }).select('email');

    const results = {
      total: users.length,
      emailSent: 0,
      emailFailed: 0,
      inAppCreated: 0,
    };

    // process each recipient independently — Promise.allSettled so one
    // failure (e.g. a bounced email) doesn't abort the whole batch
    await Promise.allSettled(
      users.map(async (user) => {
        if (sendEmail) {
          try {
            await sendAdminEmail(user.email, subject.trim(), message.trim());
            results.emailSent += 1;
          } catch (err) {
            console.error(`[ADMIN MESSAGE] Email failed for ${user.email}:`, err.message);
            results.emailFailed += 1;
          }
        }

        if (sendInApp) {
          await Notification.create({
            userId: user._id,
            title: subject.trim(),
            message: message.trim(),
            actionPath: actionPath || '/',
            sentBy: req.user.id,
          });
          results.inAppCreated += 1;
        }
      })
    );

    res.json({ message: 'Messages processed', results });
  } catch (error) {
    console.error('sendMessage error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/admin/referral-stats
const getReferralStats = async (req, res) => {
  try {
    const results = await User.aggregate([
      { $match: { referralSource: { $ne: '' } } },
      { $group: { _id: '$referralSource', count: { $sum: 1 } } },
    ]);

    const counts = { instagram: 0, friend_referral: 0, google_search: 0, whatsapp: 0, other: 0 };
    results.forEach((r) => {
      if (counts[r._id] !== undefined) counts[r._id] = r.count;
    });

    res.json({ counts });
  } catch (error) {
    console.error('getReferralStats error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── brand verification (done by hand by the admin team) ─────────────────────
// A brand is verified ONLY by the review endpoint below. Both routes are
// admin-only (protect + isAdmin in admin.routes.js).

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;
const REVIEW_STATUSES = [STATUS.VERIFIED, STATUS.NOT_VERIFIED, STATUS.PENDING];

// brands that still need a decision: 'pending', and also any brand that has no
// status saved at all (so nobody can hide from the queue)
const statusQuery = (status) => {
  if (status === STATUS.VERIFIED || status === STATUS.NOT_VERIFIED) return { 'verification.status': status };
  return { 'verification.status': { $nin: [STATUS.VERIFIED, STATUS.NOT_VERIFIED] } };
};

// GET /api/admin/brand-verifications?status=pending|not_verified|verified&search=&page=&limit=
const listBrandVerifications = async (req, res) => {
  try {
    const status = REVIEW_STATUSES.includes(req.query.status) ? req.query.status : STATUS.PENDING;
    const search = (typeof req.query.search === 'string' ? req.query.search : '').trim();
    const { page, limit, skip } = parsePaging(req);

    const query = statusQuery(status);
    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      const emailMatches = await User.find({ role: 'brand', email: rx }).select('_id').lean();
      query.$or = [
        { brandName: rx },
        { phone: rx },
        { gstin: rx },
        { udyam: rx },
        { 'instagram.handle': rx },
        { userId: { $in: emailMatches.map((u) => u._id) } },
      ];
    }

    // waiting brands: the one waiting longest first. Decided brands: latest decision first.
    const sort = status === STATUS.PENDING
      ? { 'verification.requestedAt': 1, createdAt: 1, _id: 1 }
      : { 'verification.reviewedAt': -1, _id: -1 };

    const [brands, total, pending, notVerified, verified] = await Promise.all([
      Brand.find(query)
        .select('-instagram.accessToken -savedCreators')
        .populate('userId', 'email isEmailVerified createdAt lastActiveAt')
        .populate('verification.reviewedBy', 'email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Brand.countDocuments(query),
      Brand.countDocuments(statusQuery(STATUS.PENDING)),
      Brand.countDocuments(statusQuery(STATUS.NOT_VERIFIED)),
      Brand.countDocuments(statusQuery(STATUS.VERIFIED)),
    ]);

    res.json({
      brands,
      total,
      status,
      counts: { pending, not_verified: notVerified, verified },
      pagination: { page, hasMore: skip + brands.length < total },
    });
  } catch (error) {
    console.error('listBrandVerifications error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/admin/brand-verifications/:brandId   body: { status, note }
// status: 'verified' | 'not_verified' | 'pending'. "Not verified" needs a note,
// because the brand reads it to know what to fix.
const reviewBrandVerification = async (req, res) => {
  try {
    const { brandId } = req.params;
    if (!OBJECT_ID.test(String(brandId))) return res.status(404).json({ message: 'Brand not found' });

    const status = req.body && req.body.status;
    if (!REVIEW_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Status must be verified, not_verified or pending' });
    }
    const note = typeof (req.body && req.body.note) === 'string' ? req.body.note.trim().slice(0, 500) : '';
    if (status === STATUS.NOT_VERIFIED && note.length < 3) {
      return res.status(400).json({ message: 'Please write a short note telling the brand what to fix' });
    }

    const set = {
      'verification.status': status,
      'verification.note': status === STATUS.VERIFIED ? '' : note,
      'verification.reason': '',
      'verification.reviewedAt': new Date(),
      'verification.reviewedBy': req.user._id,
    };
    // moved back to the queue by hand: it is waiting again from now
    if (status === STATUS.PENDING) set['verification.requestedAt'] = new Date();

    const brand = await Brand.findByIdAndUpdate(brandId, { $set: set }, { new: true }).select('userId brandName verification');
    if (!brand) return res.status(404).json({ message: 'Brand not found' });

    console.log(`[BRAND VERIFICATION] ${brand.brandName} (${brand._id}) -> ${status} by admin ${req.user.email}`);

    // A brand that is no longer verified must stop receiving live chat messages
    // at once. Its open connections may still be sitting inside chat rooms they
    // joined earlier, so take them out of those rooms (they cannot join again).
    const io = req.app && req.app.get && req.app.get('io');
    if (io && status !== STATUS.VERIFIED) {
      io.in(`user_${brand.userId}`).fetchSockets()
        .then((sockets) => sockets.forEach((s) => s.rooms.forEach((room) => {
          if (String(room).startsWith('conversation_')) s.leave(room);
        })))
        .catch((err) => console.error('[BRAND VERIFICATION] could not leave chat rooms:', err.message));
    }

    // tell the brand - best effort, a failed message must never undo the decision
    if (status !== STATUS.PENDING) {
      const title = status === STATUS.VERIFIED ? 'Your brand is verified 🎉' : 'We could not verify your brand yet';
      const body = status === STATUS.VERIFIED
        ? 'You can now post campaigns and message creators on GoodCreator.'
        : `${note} Please update your details in your profile and send it for verification again.`;
      createNotification({ userId: brand.userId, type: 'admin', title, message: body, actionPath: '/brand/profile' });
      sendPushNotification(String(brand.userId), { title, body, url: '/brand/profile' });
      User.findById(brand.userId).select('email').then((u) => {
        if (u && u.email) sendAdminEmail(u.email, title, body).catch((err) => console.error('[BRAND VERIFICATION] email failed:', err.message));
      }).catch(() => { });
    }

    res.json({ message: 'Brand updated', brand });
  } catch (error) {
    console.error('reviewBrandVerification error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAllCreators, getAllBrands, sendMessage, getReferralStats, listBrandVerifications, reviewBrandVerification };
