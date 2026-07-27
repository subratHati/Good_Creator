const mongoose = require('mongoose');

// Stores admin-sent in-app notifications. This is separate from the
// dynamically-generated notifications (enquiries, applications, etc.)
// that useNotifications builds on the fly — those never needed storage
// since they're derived from existing collections. Admin messages have
// no other source of truth, so they need an actual persisted record.
const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: [true, 'Notification title is required'],
        trim: true,
    },
    message: {
        type: String,
        default: '',
    },
    // where tapping the notification should take the user — kept as a
    // plain path string, same shape as the { path } action objects
    // useNotifications already returns for other notification types
    actionPath: {
        type: String,
        default: '/',
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, { timestamps: true });

notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
