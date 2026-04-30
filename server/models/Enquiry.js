const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true,
  },
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Creator',
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['sent', 'seen', 'responded'],
    default: 'sent',
  },
}, { timestamps: true });

module.exports = mongoose.model('Enquiry', enquirySchema);