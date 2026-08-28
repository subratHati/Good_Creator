const express = require('express');
const router = express.Router();
const { subscribe, unsubscribe } = require('../controllers/push.controller');
const { protect } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/role.middleware');
const sendPushNotification = require('../utils/sendPushNotification');

router.post('/subscribe', protect, subscribe);
router.post('/unsubscribe', protect, unsubscribe);

// POST /api/push/admin-send (admin only) — manual/marketing push to
// specific userIds
router.post('/admin-send', protect, isAdmin, async (req, res) => {
  const { userIds, title, body, url } = req.body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ message: 'userIds is required' });
  }
  if (!title || !body) {
    return res.status(400).json({ message: 'title and body are required' });
  }

  try {
    let totalSent = 0;
    let totalFailed = 0;

    await Promise.all(
      userIds.map(async (userId) => {
        const result = await sendPushNotification(userId, { title, body, url });
        totalSent += result.sent;
        totalFailed += result.failed;
      })
    );

    res.json({ message: 'Push notifications sent', totalSent, totalFailed });
  } catch (error) {
    console.error('admin-send push error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
