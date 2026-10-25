const mongoose = require('mongoose');

// A permanent, privacy-safe record of every deleted account. It never
// stores the full email, only a masked version, plus the reason given.
const deletedAccountSchema = new mongoose.Schema({
    role: { type: String, enum: ['creator', 'brand'], required: true },
    name: { type: String, default: '' },
    maskedEmail: { type: String, default: '' },
    reasonCategory: { type: String, default: '' },
    reasonText: { type: String, default: '', maxlength: 1000 },
    userId: { type: mongoose.Schema.Types.ObjectId },
    profileId: { type: mongoose.Schema.Types.ObjectId },
    deletedAt: { type: Date, default: Date.now },
    // how many items each cleanup step removed, and which steps (if any) failed
    cleanupLog: { type: mongoose.Schema.Types.Mixed, default: {} },
    cleanupFailed: { type: [String], default: [] },
}, { timestamps: true });

deletedAccountSchema.index({ deletedAt: -1 });

module.exports = mongoose.model('DeletedAccount', deletedAccountSchema);