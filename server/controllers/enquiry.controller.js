const Enquiry = require('../models/Enquiry');
const Brand = require('../models/Brand');
const Creator = require('../models/Creator');

// POST /api/enquiries
const sendEnquiry = async (req, res) => {
  try {
    const { creatorId, message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const brand = await Brand.findOne({ userId: req.user.id });
    if (!brand) {
      return res.status(404).json({ message: 'Brand profile not found' });
    }

    const enquiry = await Enquiry.create({
      brandId: brand._id,
      creatorId,
      message,
    });

    res.status(201).json({ message: 'Enquiry sent successfully', enquiry });
  } catch (error) {
    console.error('sendEnquiry error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/enquiries/received
const getReceivedEnquiries = async (req, res) => {
  try {
    const creator = await Creator.findOne({ userId: req.user.id });
    if (!creator) {
      return res.status(404).json({ message: 'Creator profile not found' });
    }

    const enquiries = await Enquiry.find({ creatorId: creator._id })
      .populate('brandId', 'brandName logo category location instagram.handle')
      .sort({ createdAt: -1 });

    res.json({ enquiries });
  } catch (error) {
    console.error('getReceivedEnquiries error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/enquiries/:id/seen
const markSeen = async (req, res) => {
  try {
    await Enquiry.findByIdAndUpdate(req.params.id, { status: 'seen' });
    res.json({ message: 'Marked as seen' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { sendEnquiry, getReceivedEnquiries, markSeen };