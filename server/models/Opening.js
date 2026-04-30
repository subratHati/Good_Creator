const mongoose = require('mongoose');

const openingSchema = new mongoose.Schema({
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  contentType: {
    type: String,
    enum: ['reel', 'post', 'story', 'ugc'],
    required: true,
  },
  isCollab: {
    type: Boolean,
    default: true,
  },
  quantity: {
    type: Number,
    default: 1,
  },
  budgetMin: {
    type: Number,
    default: 0,
  },
  budgetMax: {
    type: Number,
    default: 0,
  },
  isBarter: {
    type: Boolean,
    default: false,
  },
  barterDetails: {
    type: String,
    default: '',
  },
  requirements: {
    minFollowers: { type: Number, default: 0 },
    categories: { type: [String], default: [] },
    locations: { type: [String], default: [] },
    minEngagement: { type: Number, default: 0 },
  },
  deadline: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'draft'],
    default: 'active',
  },
}, { timestamps: true });

openingSchema.index({ brandId: 1 });
openingSchema.index({ status: 1 });
openingSchema.index({ contentType: 1 });

module.exports = mongoose.model('Opening', openingSchema);