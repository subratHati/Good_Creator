const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Creator', required: true },
  brandUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  creatorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lastMessage: { type: String, default: '' },
  lastMessageAt: { type: Date, default: Date.now },
  lastMessageBy: { type: String, enum: ['brand', 'creator'] },
  unreadByBrand: { type: Number, default: 0 },
  unreadByCreator: { type: Number, default: 0 },
}, { timestamps: true });

// ensure one conversation per brand-creator pair
conversationSchema.index({ brandId: 1, creatorId: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', conversationSchema);
