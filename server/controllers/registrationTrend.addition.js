// Add this function to analytics.controller.js, and export it alongside
// the existing getUserAnalytics/getCampaignAnalytics/getCollabAnalytics.
// const User = require('../models/User'); // confirm this import already exists at the top — don't duplicate it if so

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

module.exports = { getRegistrationTrend }; // merge this into the existing module.exports object — don't overwrite the others
