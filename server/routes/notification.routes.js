const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { getMyNotifications, markAsRead } = require('../controllers/notification.controller');

// no role restriction — any logged-in user (creator or brand) can read
// and mark their own notifications
router.get('/my', protect, getMyNotifications);
router.put('/:id/read', protect, markAsRead);

module.exports = router;
