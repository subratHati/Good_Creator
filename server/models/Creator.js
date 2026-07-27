const mongoose = require('mongoose');

const creatorSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },
    profilePhoto: {
        type: String,
        default: '',
    },
    bio: {
        type: String,
        maxlength: [300, 'Bio cannot exceed 300 characters'],
        default: '',
    },
    location: {
        city: { type: String, default: '' },
        state: { type: String, default: '' },
    },
    categories: {
        type: [String],
        enum: ['lifestyle', 'food', 'travel', 'fashion', 'beauty', 'tech', 'fitness', 'gaming', 'education', 'finance', 'other'],
        default: [],
    },
    languages: {
        type: [String],
        default: ['Hindi', 'English'],
    },
    instagram: {
        handle: { type: String, default: '' },
        userId: { type: String, default: '' },
        accessToken: { type: String, default: '' },
        followersCount: { type: Number, default: 0 },
        avgReach: { type: Number, default: 0 },
        avgLikes: { type: Number, default: 0 },
        avgViews: { type: Number, default: 0 },
        avgComments: { type: Number, default: 0 },
        avgSaved: { type: Number, default: 0 },
        avgShares: { type: Number, default: 0 },
        engagementRate: { type: Number, default: 0 },
        isConnected: { type: Boolean, default: false },
        isManuallyAdded: { type: Boolean, default: false },
        lastSynced: { type: Date, default: null },
        tokenRefreshedAt: { type: Date, default: Date.now },
    },
    pricing: {
        reel: { type: Number, default: 0 },
        post: { type: Number, default: 0 },
        story: { type: Number, default: 0 },
        ugcCollab: { type: Number, default: 0 },
        ugcNonCollab: { type: Number, default: 0 },
    },
    barterEnabled: {
        type: Boolean,
        default: false,
    },
    isOpenForCollab: {
        type: Boolean,
        default: true,
    },
    insightScreenshot: {
        type: String,
        default: '',
    },
    isAdminVerified: {
        type: Boolean,
        default: false,
    },
    sampleContentLinks: {
        type: [String],
        default: [],
    },

    bankDetails: {
        accountHolderName: { type: String, default: '' },
        accountNumber: { type: String, default: '' },
        ifscCode: { type: String, default: '' },
        bankName: { type: String, default: '' },
        isVerified: { type: Boolean, default: false },
    },

},
    { timestamps: true }
);

// indexes for fast search queries
creatorSchema.index({ 'instagram.followersCount': 1 });
creatorSchema.index({ categories: 1 });
creatorSchema.index({ 'location.city': 1 });
creatorSchema.index({ isOpenForCollab: 1 });
creatorSchema.index({ 'instagram.engagementRate': 1 });

module.exports = mongoose.model("Creator", creatorSchema);