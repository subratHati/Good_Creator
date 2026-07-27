const Notification = require('../models/Notification');

// GET /api/notifications/my
// Returns the logged-in user's own admin-sent notifications, most recent first.
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ notifications });
  } catch (error) {
    console.error('getMyNotifications error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/notifications/:id/read
// Marks a single notification as read. Only the owning user can mark their
// own notification — this is enforced by the query filter, not just the
// route param, so a user can't mark someone else's notification as read
// by guessing an ID.
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

module.exports = { getMyNotifications, markAsRead };
