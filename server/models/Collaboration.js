const mongoose = require('mongoose');

// A Collaboration is created the moment a brand pays for a Collab
// (i.e. at the same point verifyPayment succeeds) — never before. Until
// payment happens, a "Create Collab" proposal exists only as a
// payment_request message with status: 'pending', same as before this
// schema existed. This document is the durable, dashboard-friendly
// record of an ACTUALLY PAID collaboration — Message.js remains the
// complete, untouched ongoing chat/negotiation record; nothing here
// replaces it, this is purely an additional, structured summary built
// on top of the same underlying facts.
const collaborationSchema = new mongoose.Schema({
    // the same collabId already generated in Message.js (generateCollabId.js)
    // at payment time — this IS the link between a Collaboration document
    // and its full message history, not a new, separate identifier
    collabId: {
        type: String,
        required: true,
        unique: true,
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
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
    },

    // essentials snapshotted from the payment_request at the moment of
    // payment — matches what's already in paymentRequest, not a fuller
    // audit record (no razorpay IDs, timestamps, etc. duplicated here;
    // those remain the Message collection's responsibility)
    amount: {
        type: Number,
        required: true,
    },
    deliverables: {
        reels: { type: Number, default: 0 },
        posts: { type: Number, default: 0 },
        stories: { type: Number, default: 0 },
        ugc: { type: Number, default: 0 },
    },
    deadline: {
        type: Date,
        default: null,
    },

    // the 3-state status this dashboard is actually built around:
    //   pending   — paid, awaiting delivery submission/approval
    //   delivered — brand approved the delivery, payout not yet completed
    //   completed — payout has actually been credited to the creator
    // Kept intentionally separate from Message.js's own status fields
    // (paymentRequest.deliveryStatus, delivery.status, payoutStatus) —
    // this is a simplified, dashboard-facing view; the message-level
    // fields remain the detailed, granular source of truth for the
    // chat/approval flow itself.
    status: {
        type: String,
        enum: ['pending', 'delivered', 'completed'],
        default: 'pending',
    },

    paidAt: {
        type: Date,
        default: Date.now,
    },
    deliveredAt: {
        type: Date,
        default: null,
    },
    completedAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

// fast lookups for exactly the queries a dashboard needs: "this
// creator's collaborations" and "this brand's collaborations", most
// recent first
collaborationSchema.index({ creatorId: 1, createdAt: -1 });
collaborationSchema.index({ brandId: 1, createdAt: -1 });
collaborationSchema.index({ status: 1 });

module.exports = mongoose.model('Collaboration', collaborationSchema);
