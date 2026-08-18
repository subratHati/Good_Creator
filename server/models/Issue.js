const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // who submitted it — kept as a plain field alongside userId so admin
    // views can filter/display without an extra populate in the common case
    role: {
        type: String,
        enum: ['creator', 'brand'],
        required: true,
    },
    category: {
        type: String,
        enum: ['collab_issue', 'bug', 'fraud_scam', 'payment_issue', 'other'],
        required: true,
    },
    message: {
        type: String,
        required: [true, 'Please describe your issue'],
        maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    status: {
        type: String,
        enum: ['open', 'in_review', 'resolved'],
        default: 'open',
    },
}, { timestamps: true });

issueSchema.index({ status: 1, createdAt: -1 });
issueSchema.index({ userId: 1 });

module.exports = mongoose.model('Issue', issueSchema);
