const mongoose = require('mongoose');

// One AI-assistant conversation per creator/brand user. Kept separate from
// AdminConversation (human admin chat) so the working admin chat can't be affected.
const assistantConversationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    userRole: { type: String, enum: ['creator', 'brand'], required: true },
    status: { type: String, enum: ['active', 'needs_human'], default: 'active' },
    greeted: { type: Boolean, default: false },
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now },
    unreadByUser: { type: Number, default: 0 },
    // daily check-ins (messages the AI starts)
    checkinsEnabled: { type: Boolean, default: true },
    lastCheckinAt: { type: Date, default: null },
    lastCheckinSlot: { type: String, default: '' },
    lastCheckinTopic: { type: String, default: '' },
    ignoredCheckins: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('AssistantConversation', assistantConversationSchema);