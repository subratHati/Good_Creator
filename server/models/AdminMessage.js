const mongoose = require('mongoose');

// Messages within an AdminConversation. Supports plain text plus two
// rich "share" types (creator profile, campaign) — rendered as
// WhatsApp-style preview cards, clickable through to the real profile
// or campaign page.
const adminMessageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminConversation',
        required: true,
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    senderRole: {
        type: String,
        enum: ['admin', 'creator', 'brand'],
        required: true,
    },
    type: {
        type: String,
        enum: ['text', 'creator_share', 'campaign_share'],
        default: 'text',
    },
    text: { type: String, default: '' },

    // populated only when type === 'creator_share' — a snapshot at
    // share time (name/photo/stats), so the card still renders
    // correctly even if the creator later edits their profile
    creatorShare: {
        creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Creator' },
        name: String,
        profilePhoto: String,
        followersCount: Number,
        engagementRate: Number,
        avgViews: Number,
    },

    // populated only when type === 'campaign_share' — same
    // snapshot-at-share-time reasoning
    campaignShare: {
        openingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Opening' },
        title: String,
        brandName: String,
        brandLogo: String,
        budgetMin: Number,
        budgetMax: Number,
        isBarter: Boolean,
    },

    seen: { type: Boolean, default: false },
}, { timestamps: true });

adminMessageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('AdminMessage', adminMessageSchema);
