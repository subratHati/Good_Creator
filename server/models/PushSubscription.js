const mongoose = require('mongoose');

// A single browser/device's push subscription. One user can have multiple
// (e.g. subscribed on both their phone and laptop), so this is its own
// collection keyed by userId, not a field on User/Creator/Brand.
const pushSubscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    endpoint: {
        type: String,
        required: true,
        unique: true,
    },
    keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true },
    },
    // kept for context in admin/debugging views — not used for any logic
    userAgent: {
        type: String,
        default: '',
    },
}, { timestamps: true });

pushSubscriptionSchema.index({ userId: 1 });

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
