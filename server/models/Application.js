const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  openingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Opening',
    required: true,
  },
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Creator',
    required: true,
  },
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true,
  },
  coverNote: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'viewed', 'shortlisted', 'rejected'],
    default: 'pending',
  },
}, { timestamps: true });

// prevent duplicate applications
applicationSchema.index({ openingId: 1, creatorId: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);