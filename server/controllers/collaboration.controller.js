// controllers/collaboration.controller.js
const Collaboration = require('../models/Collaboration');
const Creator = require('../models/Creator');
const Brand = require('../models/Brand');

// Translates a time-range filter keyword into a real Date to filter
// paidAt by. 'all' (or no filter) returns null, meaning no date
// restriction at all.
const getDateRangeStart = (range) => {
  const now = new Date();
  switch (range) {
    case 'this_month': {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    case 'last_3_months': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 3);
      return d;
    }
    case 'last_6_months': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 6);
      return d;
    }
    case 'this_year': {
      return new Date(now.getFullYear(), 0, 1);
    }
    default:
      return null;
  }
};

// ─── GET /api/collaborations/creator ─────────────────────────────────────────
// Returns the logged-in creator's own collaborations, with optional
// status and time-range filters, plus a summary (upcoming vs already
// credited totals) for the dashboard's top section.
const getCreatorCollaborations = async (req, res) => {
  try {
    const creator = await Creator.findOne({ userId: req.user.id });
    if (!creator) {
      return res.status(404).json({ message: 'Creator profile not found' });
    }

    const { status, range } = req.query;
    const query = { creatorId: creator._id };

    if (status && ['pending', 'delivered', 'completed'].includes(status)) {
      query.status = status;
    }

    const rangeStart = getDateRangeStart(range);
    if (rangeStart) {
      query.paidAt = { $gte: rangeStart };
    }

    const collaborations = await Collaboration.find(query)
      .populate('brandId', 'brandName logo')
      .sort({ paidAt: -1 });

    // summary figures — computed from ALL of this creator's
    // collaborations (ignoring the status/range filters above), since
    // the dashboard's summary cards should always reflect the creator's
    // true overall standing, not whatever filter happens to be applied
    // to the list below them
    const allCollabs = await Collaboration.find({ creatorId: creator._id });
    const platformFeeRate = 0.15;

    const upcomingAmount = allCollabs
      .filter(c => c.status === 'pending' || c.status === 'delivered')
      .reduce((sum, c) => sum + Math.round(c.amount * (1 - platformFeeRate)), 0);

    const creditedAmount = allCollabs
      .filter(c => c.status === 'completed')
      .reduce((sum, c) => sum + Math.round(c.amount * (1 - platformFeeRate)), 0);

    res.json({
      collaborations,
      summary: {
        upcomingAmount,
        creditedAmount,
        totalCollaborations: allCollabs.length,
      },
    });
  } catch (error) {
    console.error('getCreatorCollaborations error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET /api/collaborations/brand ───────────────────────────────────────────
// Same shape, for the brand's own view of their collaborations.
const getBrandCollaborations = async (req, res) => {
  try {
    const brand = await Brand.findOne({ userId: req.user.id });
    if (!brand) {
      return res.status(404).json({ message: 'Brand profile not found' });
    }

    const { status, range } = req.query;
    const query = { brandId: brand._id };

    if (status && ['pending', 'delivered', 'completed'].includes(status)) {
      query.status = status;
    }

    const rangeStart = getDateRangeStart(range);
    if (rangeStart) {
      query.paidAt = { $gte: rangeStart };
    }

    const collaborations = await Collaboration.find(query)
      .populate('creatorId', 'name profilePhoto')
      .sort({ paidAt: -1 });

    const allCollabs = await Collaboration.find({ brandId: brand._id });

    const totalSpent = allCollabs.reduce((sum, c) => sum + c.amount, 0);
    const activeAmount = allCollabs
      .filter(c => c.status === 'pending' || c.status === 'delivered')
      .reduce((sum, c) => sum + c.amount, 0);

    res.json({
      collaborations,
      summary: {
        totalSpent,
        activeAmount,
        totalCollaborations: allCollabs.length,
      },
    });
  } catch (error) {
    console.error('getBrandCollaborations error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getCreatorCollaborations,
  getBrandCollaborations,
};
