const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { getMyNotifications, markAsRead, getUnreadNotificationCount } = require('../controllers/notification.controller');

// no role restriction — any logged-in user (creator or brand) can read
// and mark their own notifications
router.get('/my', protect, getMyNotifications);
router.put('/:id/read', protect, markAsRead);
router.get('/unread-count', protect, getUnreadNotificationCount);

module.exports = router;
