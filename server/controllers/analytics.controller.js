// controllers/analytics.controller.js
const Creator = require('../models/Creator');
const Brand = require('../models/Brand');
const Opening = require('../models/Opening');
const Collaboration = require('../models/Collaboration');
const Application = require('../models/Application');
const User = require('../models/User');

// IST is UTC+5:30 — a fixed offset, no DST to worry about. Rather than
// relying on the server's local timezone (Render runs in UTC, which
// would make "today" start 5.5 hours late relative to India), this
// computes midnight IST explicitly by working in the IST-shifted frame
// and converting back to a genuine UTC Date at the end.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const getDateRangeStart = (range) => {
  const nowIST = new Date(Date.now() + IST_OFFSET_MS);
  switch (range) {
    case 'today': {
      const d = new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), nowIST.getUTCDate()));
      return new Date(d.getTime() - IST_OFFSET_MS);
    }
    case 'this_week': {
      const day = nowIST.getUTCDay(); // 0 = Sunday
      const d = new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), nowIST.getUTCDate() - day));
      return new Date(d.getTime() - IST_OFFSET_MS);
    }
    case 'this_month': {
      const d = new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), 1));
      return new Date(d.getTime() - IST_OFFSET_MS);
    }
    default:
      return null;
  }
};

// ─── GET /api/analytics/users?page=1&limit=25&range=today&role=creator&category=food ─
// Paged straight from the User collection: the date range and role both live
// on User, and the list is ordered by registration time anyway. Category lives
// on the Creator/Brand profile, so when it's set we first resolve the matching
// userIds. Totals come from one grouped count over the SAME filter, so the
// summary is the true total no matter how many rows have been loaded.
// Sorted by createdAt with _id as a tiebreaker so skip/limit never repeats or
// skips a row between pages.
// Users who registered but never completed a profile are included (they have
// no name/category) — consistent with the registration charts above this list.
const getUserAnalytics = async (req, res) => {
  try {
    const { range, role, category } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const skip = (page - 1) * limit;

    const roles = role === 'creator' || role === 'brand' ? [role] : ['creator', 'brand'];
    const match = { role: { $in: roles } };

    const rangeStart = getDateRangeStart(range);
    if (rangeStart) match.createdAt = { $gte: rangeStart };

    if (category) {
      const [creatorProfiles, brandProfiles] = await Promise.all([
        roles.includes('creator') ? Creator.find({ categories: category }).select('userId').lean() : [],
        roles.includes('brand') ? Brand.find({ category }).select('userId').lean() : [],
      ]);
      match._id = { $in: [...creatorProfiles, ...brandProfiles].map((p) => p.userId) };
    }

    const [users, roleCounts] = await Promise.all([
      User.find(match)
        .select('_id role email createdAt')
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.aggregate([{ $match: match }, { $group: { _id: '$role', count: { $sum: 1 } } }]),
    ]);

    const counts = { creator: 0, brand: 0 };
    roleCounts.forEach((r) => { counts[r._id] = r.count; });
    const total = counts.creator + counts.brand;

    // profile details for just this page's users (<= limit ids)
    const userIds = users.map((u) => u._id);
    const [creators, brands] = await Promise.all([
      Creator.find({ userId: { $in: userIds } }).select('userId name categories').lean(),
      Brand.find({ userId: { $in: userIds } }).select('userId brandName category').lean(),
    ]);
    const creatorByUserId = {};
    creators.forEach((c) => { creatorByUserId[c.userId.toString()] = c; });
    const brandByUserId = {};
    brands.forEach((b) => { brandByUserId[b.userId.toString()] = b; });

    const items = users.map((u) => {
      const profile = u.role === 'creator' ? creatorByUserId[u._id.toString()] : brandByUserId[u._id.toString()];
      return {
        _id: u._id,
        role: u.role,
        email: u.email,
        createdAt: u.createdAt,
        name: u.role === 'creator' ? profile?.name : profile?.brandName,
        category: u.role === 'creator' ? profile?.categories?.[0] : profile?.category,
        hasProfile: !!profile,
      };
    });

    res.json({
      users: items,
      summary: { total, totalCreators: counts.creator, totalBrands: counts.brand },
      pagination: { page, hasMore: skip + items.length < total },
    });
  } catch (error) {
    console.error('getUserAnalytics error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET /api/analytics/campaigns ────────────────────────────────────────────
// Filter: status (active/closed/draft), or 'all' to include everything
const getCampaignAnalytics = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;

    const campaigns = await Opening.find(query)
      .populate('brandId', 'brandName category')
      .sort({ createdAt: -1 })
      .lean();

    // applicant counts per campaign, grouped by status, in one aggregation
    // rather than N queries — matched against just the campaigns we're
    // actually returning, not every application in the database
    const campaignIds = campaigns.map(c => c._id);
    const counts = await Application.aggregate([
      { $match: { openingId: { $in: campaignIds } } },
      { $group: { _id: { openingId: '$openingId', status: '$status' }, count: { $sum: 1 } } },
    ]);

    const countsByOpening = {};
    counts.forEach(({ _id, count }) => {
      const key = String(_id.openingId);
      if (!countsByOpening[key]) {
        countsByOpening[key] = { applied: 0, shortlisted: 0, rejected: 0 };
      }
      // "applied" is the total across every status — pending/viewed/etc.
      // all still count as a genuine application received
      countsByOpening[key].applied += count;
      if (_id.status === 'shortlisted') countsByOpening[key].shortlisted += count;
      if (_id.status === 'rejected') countsByOpening[key].rejected += count;
    });

    const campaignsWithCounts = campaigns.map(c => ({
      ...c,
      applicantCounts: countsByOpening[String(c._id)] || { applied: 0, shortlisted: 0, rejected: 0 },
    }));

    const summary = {
      total: campaigns.length,
      active: campaigns.filter(c => c.status === 'active').length,
      closed: campaigns.filter(c => c.status === 'closed').length,
      draft: campaigns.filter(c => c.status === 'draft').length,
    };

    res.json({ campaigns: campaignsWithCounts, summary });
  } catch (error) {
    console.error('getCampaignAnalytics error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET /api/analytics/collabs ──────────────────────────────────────────────
// Filter: status (pending/delivered/completed) — matches Collaboration's
// own 3-state status exactly, same as the creator/brand dashboards
const getCollabAnalytics = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const collabs = await Collaboration.find(query)
      .populate('creatorId', 'name')
      .populate('brandId', 'brandName')
      .sort({ paidAt: -1 });

    const summary = {
      total: collabs.length,
      pending: collabs.filter(c => c.status === 'pending').length,
      delivered: collabs.filter(c => c.status === 'delivered').length,
      completed: collabs.filter(c => c.status === 'completed').length,
      totalValue: collabs.reduce((sum, c) => sum + (c.amount || 0), 0),
    };

    res.json({ collabs, summary });
  } catch (error) {
    console.error('getCollabAnalytics error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const getTrendRangeStart = (range) => {
  const now = new Date();
  switch (range) {
    case 'this_month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'last_month':
      return new Date(now.getFullYear(), now.getMonth() - 1, 1);
    case 'last_3_months':
      return new Date(now.getFullYear(), now.getMonth() - 3, 1);
    case 'all':
    default:
      return null;
  }
};

const getTrendRangeEnd = (range) => {
  const now = new Date();
  if (range === 'last_month') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return null;
};

const GRANULARITY_UNIT = {
  day: 'day',
  week: 'week',
  month: 'month',
};

// ─── GET /api/analytics/registration-trend?role=creator&range=last_3_months&granularity=day ─
const getRegistrationTrend = async (req, res) => {
  try {
    const { role, range = 'all', granularity = 'day' } = req.query;

    if (!['creator', 'brand'].includes(role)) {
      return res.status(400).json({ message: 'role must be creator or brand' });
    }
    const unit = GRANULARITY_UNIT[granularity] || 'day';

    const rangeStart = getTrendRangeStart(range);
    const rangeEnd = getTrendRangeEnd(range);

    const match = { role };
    if (rangeStart || rangeEnd) {
      match.createdAt = {};
      if (rangeStart) match.createdAt.$gte = rangeStart;
      if (rangeEnd) match.createdAt.$lt = rangeEnd;
    }

    const results = await User.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            $dateTrunc: { date: '$createdAt', unit, timezone: 'Asia/Kolkata' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          count: 1,
        },
      },
    ]);

    res.json({ role, range, granularity, points: results });
  } catch (error) {
    console.error('getRegistrationTrend error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getUserAnalytics,
  getCampaignAnalytics,
  getCollabAnalytics,
  getRegistrationTrend
};
