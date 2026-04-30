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
    category: {
        type: String,
        enum: ['fashion', 'food', 'beauty', 'tech', 'fitness', 'travel', 'education', 'finance', 'lifestyle', 'other'],
        default: 'other',
    },
    location: {
        city: { type: String, default: '' },
        state: { type: String, default: '' },
    },
    instagram: {
        handle: { type: String, default: '' },
        userId: { type: String, default: '' },
        accessToken: { type: String, default: '' },
        followersCount: { type: Number, default: 0 },
        profilePicUrl: { type: String, default: '' },
        isVerified: { type: Boolean, default: false },
        tokenRefreshedAt: { type: Date, default: Date.now },
    },
    savedCreators: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Creator',
    }],
}, { timestamps: true });

module.exports = mongoose.model('Brand', brandSchema);