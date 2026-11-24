const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    brandName: {
        type: String,
        required: [true, 'Brand name is required'],
        trim: true,
    },
    logo: {
        type: String,
        default: '',
    },
    website: {
        type: String,
        default: '',
    },
    description: {
        type: String,
        default: '',
    },
    // ── details the admin team uses to verify the brand (never shown publicly) ──
    // phone / WhatsApp is how the team calls the brand; GSTIN and UDYAM are
    // optional proof of a registered business
    phone: {
        type: String,
        default: '',
    },
    gstin: {
        type: String,
        default: '',
    },
    udyam: {
        type: String,
        default: '',
    },
    // ── admin verification (this is NOT email verification) ──
    // Deliberately NO default for status: a brand record that has no status is
    // treated as NOT verified everywhere, so the only way to become verified is
    // for an admin to set it (see utils/brandVerification.js). New brands get
    // 'pending' written explicitly when the profile is created.
    verification: {
        status: {
            type: String,
            enum: ['pending', 'verified', 'not_verified'],
            default: undefined,
        },
        // shown to the brand when the admin marks it "not verified"
        note: { type: String, default: '' },
        // set when a verified brand changed something and went back to "waiting",
        // so the admin can see what to look at again (admin only)
        reason: { type: String, default: '' },
        requestedAt: { type: Date, default: null },
        reviewedAt: { type: Date, default: null },
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
    category: {
        type: String,
        enum: ['fashion', 'food', 'beauty', 'tech', 'fitness', 'travel', 'education', 'finance', 'lifestyle', 'entertainment', 'parenting_family', 'vlogging', 'dance', 'religious', 'news_politics', 'video_editing', 'ai_content', 'pets_wildlife', 'other'],
        default: 'other',
    },
    location: {
        city: { type: String, default: '' },
        state: { type: String, default: '' },
    },
    // true = the saved location could not be matched to our lists, so the person is
    // asked to pick it again (a pop-up until they do). Set by the clean-up script,
    // cleared when a proper location is saved.
    locationReview: { type: Boolean, default: false },
    instagram: {
        handle: { type: String, default: '' },
        userId: { type: String, default: '' },
        accessToken: { type: String, default: '' },
        followersCount: { type: Number, default: 0 },
        profilePicUrl: { type: String, default: '' },
        isVerified: { type: Boolean, default: false },
        lastSynced: { type: Date, default: null },
        tokenRefreshedAt: { type: Date, default: Date.now },
    },
    savedCreators: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Creator',
    }],
}, { timestamps: true });

// the admin verification list and the "hide unverified brands" filters both
// look brands up by this status
brandSchema.index({ 'verification.status': 1 });

module.exports = mongoose.model('Brand', brandSchema);