const Application = require('../models/Application');
const Opening = require('../models/Opening');
const Creator = require('../models/Creator');
const Brand = require('../models/Brand');

// POST /api/applications/apply
const applyToOpening = async (req, res) => {
  try {
    const { openingId, coverNote } = req.body;

    const creator = await Creator.findOne({ userId: req.user.id });
    if (!creator) {
      return res.status(404).json({ message: 'Creator profile not found' });
    }

    const opening = await Opening.findById(openingId);
    if (!opening) {
      return res.status(404).json({ message: 'Opening not found' });
    }
    if (opening.status !== 'active') {
      return res.status(400).json({ message: 'This opening is no longer active' });
    }

    const existing = await Application.findOne({
      openingId,
      creatorId: creator._id,
    });
    if (existing) {
      return res.status(400).json({ message: 'You have already applied to this opening' });
    }

    const application = await Application.create({
      openingId,
      creatorId: creator._id,
      brandId: opening.brandId,
      coverNote: coverNote || '',
    });

    res.status(201).json({
      message: 'Application submitted successfully',
      application,
    });
  } catch (error) {
    console.error('applyToOpening error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/applications/my
const getMyApplications = async (req, res) => {
  try {
    const creator = await Creator.findOne({ userId: req.user.id });
    if (!creator) {
      return res.status(404).json({ message: 'Creator profile not found' });
    }

    const applications = await Application.find({ creatorId: creator._id })
      .populate('openingId', 'title contentType budgetMin budgetMax status deadline isBarter')
      .populate('brandId', 'brandName logo category location')
      .sort({ createdAt: -1 });

    res.json({ applications });
  } catch (error) {
    console.error('getMyApplications error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/applications/opening/:openingId
const getOpeningApplicants = async (req, res) => {
  try {
    const brand = await Brand.findOne({ userId: req.user.id });
    if (!brand) {
      return res.status(404).json({ message: 'Brand profile not found' });
    }

    const opening = await Opening.findOne({
      _id: req.params.openingId,
      brandId: brand._id,
    });
    if (!opening) {
      return res.status(404).json({ message: 'Opening not found' });
    }

    const applications = await Application.find({
      openingId: req.params.openingId,
    })
      .populate('creatorId', 'name profilePhoto instagram categories pricing location barterEnabled isOpenForCollab isAdminVerified')
      .sort({ createdAt: -1 });

    res.json({ applications, opening });
  } catch (error) {
    console.error('getOpeningApplicants error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/applications/:id/status
const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const brand = await Brand.findOne({ userId: req.user.id });

    const application = await Application.findOne({
      _id: req.params.id,
      brandId: brand._id,
    });
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.status = status;
    await application.save();

    res.json({ message: 'Status updated', application });
  } catch (error) {
    console.error('updateApplicationStatus error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  applyToOpening,
  getMyApplications,
  getOpeningApplicants,
  updateApplicationStatus,
};