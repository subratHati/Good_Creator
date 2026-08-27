// routes/cron.js (addition — append this route to your existing cron.js file
// alongside the refresh-rotation route, don't replace the whole file)

// GET /api/cron/notify-inactive?key=...
// Finds users inactive between 3 and 4 days (a window, not "3+ days
// unbounded", so someone already notified and now 10 days inactive
// doesn't get re-matched) who haven't been notified for this stretch
// yet, and sends each a one-time push. inactivityNotifiedAt is cleared
// automatically the next time they're active (see auth.middleware.js),
// so a future inactive stretch can notify again.
router.get('/notify-inactive', async (req, res) => {
  if (req.query.key !== process.env.CRON_SECRET_KEY) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    const User = require('../models/User');
    const { sendPushNotificationBatch } = require('../utils/sendPushNotification');

    const now = Date.now();
    const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000);
    const fourDaysAgo = new Date(now - 4 * 24 * 60 * 60 * 1000);

    const inactiveUsers = await User.find({
      role: { $in: ['creator', 'brand'] },
      isActive: true,
      lastActiveAt: { $lte: threeDaysAgo, $gt: fourDaysAgo },
      inactivityNotifiedAt: null,
    }).select('_id');

    if (inactiveUsers.length === 0) {
      return res.json({ message: 'No inactive users to notify', notified: 0 });
    }

    const userIds = inactiveUsers.map((u) => u._id.toString());

    const { totalSent, totalFailed } = await sendPushNotificationBatch(userIds, {
      title: 'We miss you on GoodCreator!',
      body: "Come check out what's new — new campaigns and creators are waiting.",
      url: '/',
    });

    // mark all of them as notified for this stretch, regardless of
    // whether the push itself succeeded (a failed push, e.g. no active
    // subscription, shouldn't cause this to retry every hour until it
    // works — it'll get a fresh chance next time they go inactive again)
    await User.updateMany(
      { _id: { $in: inactiveUsers.map((u) => u._id) } },
      { inactivityNotifiedAt: new Date() }
    );

    res.json({
      message: 'Inactivity notifications sent',
      matched: inactiveUsers.length,
      totalSent,
      totalFailed,
    });
  } catch (error) {
    console.error('notify-inactive cron error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});
