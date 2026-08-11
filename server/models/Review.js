const mongoose = require('mongoose');

// Kept as its own collection rather than embedded on Creator, since reviews
// are unbounded (a popular creator could accumulate hundreds over time) and
// are only actually needed on two specific pages (CreatorPublicProfile,
// CreatorProfile) — not on every Creator.find() call elsewhere in the app
// (BrowseCreators, CreatorHome, admin lists, etc.). Keeping this separate
// means the base Creator document stays small and fast to fetch everywhere
// else, and reviews are only pulled in with their own dedicated query when
// a page genuinely needs to display them.
const reviewSchema = new mongoose.Schema({
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Creator',
        required: true,
    },
    brandName: {
        type: String,
        required: [true, 'Brand name is required'],
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: 1,
        max: 10,
    },
    reviewText: {
        type: String,
        default: '',
    },
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        default: null,
    },
}, { timestamps: true });

// speeds up the exact query pattern this collection is built for:
// "get all reviews for this one creator"
reviewSchema.index({ creatorId: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
