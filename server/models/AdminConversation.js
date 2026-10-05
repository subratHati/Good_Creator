const mongoose = require('mongoose');

// A conversation between the platform (admin) and ONE creator or brand
// user. Deliberately separate from Conversation.js (brand<->creator) —
// different participants, different purpose (manual outreach/onboarding
// push, not a collab negotiation), and keeping it separate means this
// feature can't risk anything in the existing, working chat system.
const adminConversationSchema = new mongoose.Schema({
    // the creator/brand user on the other side — always a User, since
    // admin may message someone before they've even completed their
    // Creator/Brand profile
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true, // one admin conversation per user, ever — reused across all admin messages to that person
    },
    userRole: {
        type: String,
        enum: ['creator', 'brand'],
        required: true,
    },
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now },
    lastMessageBy: { type: String, enum: ['admin', 'user'] },
    unreadByUser: { type: Number, default: 0 },
    unreadByAdmin: { type: Number, default: 0 },
}, { timestamps: true });

adminConversationSchema.index({ lastMessageAt: -1 });
adminConversationSchema.index({ unreadByAdmin: -1, lastMessageAt: -1 });

module.exports = mongoose.model('AdminConversation', adminConversationSchema);
