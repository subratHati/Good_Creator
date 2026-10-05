const Creator = require('../models/Creator');
const Brand = require('../models/Brand');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendAdminEmail } = require('../services/email.service');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parsePaging = (req) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  return { page, limit, skip: (page - 1) * limit };
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
      Creator.find(query)
        .select('-instagram.accessToken')
        .populate('userId', 'email isActive isEmailVerified createdAt')
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
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
      Brand.find(query)
        .select('-instagram.accessToken')
        .populate('userId', 'email isActive isEmailVerified createdAt')
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
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

module.exports = { getAllCreators, getAllBrands, sendMessage, getReferralStats };
