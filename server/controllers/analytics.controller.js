// controllers/analytics.controller.js
const Creator = require('../models/Creator');
const Brand = require('../models/Brand');
const Opening = require('../models/Opening');
const Collaboration = require('../models/Collaboration');
const Application = require('../models/Application');
const User = require('../models/User');

const getDateRangeStart = (range) => {
  const now = new Date();
  switch (range) {
    case 'today': {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'this_week': {
      const d = new Date(now);
      const day = d.getDay(); // 0 = Sunday
      d.setDate(d.getDate() - day);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'this_month': {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    default:
      return null;
  }
};

// ─── GET /api/analytics/users ────────────────────────────────────────────────
// Filters: range (today/this_week/this_month), role (creator/brand),
// category
const getUserAnalytics = async (req, res) => {
  try {
    const { range, role, category } = req.query;
    const rangeStart = getDateRangeStart(range);

    // find matching User ids first (for the date-range filter, which
    // lives on User.createdAt, not on Creator/Brand documents)
    const userQuery = {};
    if (rangeStart) userQuery.createdAt = { $gte: rangeStart };
    if (role) userQuery.role = role;

    const matchingUsers = await User.find(userQuery).select('_id role createdAt email').lean();
    const userIdsByRole = {
      creator: matchingUsers.filter(u => u.role === 'creator').map(u => u._id),
      brand: matchingUsers.filter(u => u.role === 'brand').map(u => u._id),
    };

    let creators = [];
    let brands = [];

    if (!role || role === 'creator') {
      const creatorQuery = { userId: { $in: userIdsByRole.creator } };
      if (category) creatorQuery.categories = { $in: [category] };
      creators = await Creator.find(creatorQuery)
        .select('name categories userId createdAt')
        .populate('userId', 'email createdAt')
        .sort({ createdAt: -1 });
    }

    if (!role || role === 'brand') {
      const brandQuery = { userId: { $in: userIdsByRole.brand } };
      if (category) brandQuery.category = category;
      brands = await Brand.find(brandQuery)
        .select('brandName category userId createdAt')
        .populate('userId', 'email createdAt')
        .sort({ createdAt: -1 });
    }

    res.json({
      creators,
      brands,
      summary: {
        totalCreators: creators.length,
        totalBrands: brands.length,
        total: creators.length + brands.length,
      },
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

module.exports = {
  getUserAnalytics,
  getCampaignAnalytics,
  getCollabAnalytics,
};
