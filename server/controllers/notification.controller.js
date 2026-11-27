const Notification = require('../models/Notification');

// GET /api/notifications/my?page=1&limit=10
const getMyNotifications = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ userId: req.user.id }),
      // the red number on the bell: ALL unread ones, not just this page
      Notification.countDocuments({ userId: req.user.id, isRead: false }),
    ]);

    res.json({
      notifications,
      unreadCount,
      pagination: { total, page, pages: Math.ceil(total / limit), hasMore: skip + notifications.length < total },
    });
  } catch (error) {
    console.error('getMyNotifications error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json({ message: 'Marked as read', notification });
  } catch (error) {
    console.error('markAsRead error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/notifications/read-all
// Called when the bell is opened: everything the person has now seen is marked
// read on the server, so the red number is the same on every device and browser.
const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany({ userId: req.user.id, isRead: false }, { isRead: true });
    res.json({ message: 'All marked as read', modified: result.modifiedCount != null ? result.modifiedCount : result.nModified || 0 });
  } catch (error) {
    console.error('markAllAsRead error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/notifications/unread-count
// Lightweight count for the bell icon's red dot — doesn't fetch full
// notification bodies, just a number.
const getUnreadNotificationCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user.id, isRead: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Reusable helper other controllers call to create a campaign-related
// notification record — same collection admin messages live in, so the
// whole app has exactly one paginatable notification history per user.
// Not an HTTP endpoint itself; imported directly by other controllers.
const createNotification = async ({ userId, type = 'admin', title, message = '', actionPath = '/' }) => {
  try {
    await Notification.create({ userId, type, title, message, actionPath });
  } catch (err) {
    console.error('createNotification error:', err.message);
  }
};

module.exports = { getMyNotifications, markAsRead, markAllAsRead, getUnreadNotificationCount, createNotification };