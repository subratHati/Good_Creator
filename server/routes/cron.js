// routes/cron.js
//
// Endpoints meant to be called by an external scheduler (e.g.
// cron-job.org), not by regular app users — protected by a shared
// secret passed as a query param, since this needs to be triggerable
// from outside without a logged-in user session.
//
// Hitting this endpoint also naturally "wakes up" a sleeping Render free
// tier instance, the same way any real visitor's request would — so
// this doubles as a simple, free way to prevent the app from being cold
// on the very next real user's request during low-traffic hours, as a
// side benefit (not the primary purpose, but a genuine plus).

const express = require('express');
const router = express.Router();
const Creator = require('../models/Creator');

// ─── GET /api/cron/refresh-rotation?key=... ──────────────────────────────────
// Reassigns a fresh random rotationValue to every creator. Meant to run
// once daily via an external scheduler. Uses bulkWrite for efficiency —
// one round-trip to the database instead of one update call per creator.
const refreshRotationValues = async (req, res) => {
  const { key } = req.query;

  if (!key || key !== process.env.CRON_SECRET_KEY) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const creators = await Creator.find().select('_id');

    const bulkOps = creators.map((creator) => ({
      updateOne: {
        filter: { _id: creator._id },
        update: { rotationValue: Math.random() },
      },
    }));

    if (bulkOps.length > 0) {
      await Creator.bulkWrite(bulkOps);
    }

    console.log(`[CRON] Refreshed rotationValue for ${bulkOps.length} creator(s).`);
    res.json({ message: 'Rotation values refreshed', count: bulkOps.length });
  } catch (error) {
    console.error('refreshRotationValues error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

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


// GET /api/cron/assistant-checkin?key=...&slot=am|pm
// Optional, for testing: &dry=1 (preview only, nothing is sent), &limit=50,
// &userId=<id> (only that user), &force=1 (ignore the once-per-slot and quiet-time rules)
router.get('/assistant-checkin', async (req, res) => {
  if (req.query.key !== process.env.CRON_SECRET_KEY) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const { runCheckins, checkinsEnabled } = require('../services/assistant/checkins');
    if (!checkinsEnabled()) {
      return res.json({ message: 'Check-ins are switched off', skipped: true });
    }
    const slot = req.query.slot === 'pm' ? 'pm' : 'am';
    const dry = req.query.dry === '1';
    const onlyUserId = req.query.userId || null;
    const force = req.query.force === '1' && !!onlyUserId;
    const limit = Number(req.query.limit) || null;

    // previews and single-user tests run now and return the result
    if (dry || onlyUserId) {
      const summary = await runCheckins({ slot, dry, onlyUserId, force, limit });
      return res.json(summary);
    }

    // the real run can take a while, so answer the scheduler straight away
    res.json({ message: 'Check-in run started', slot });
    runCheckins({ slot, limit })
      .then((s) => console.log('[CHECKIN] done', JSON.stringify(s)))
      .catch((e) => console.error('[CHECKIN] run failed:', e.message));
  } catch (error) {
    console.error('assistant-checkin error:', error.message);
    if (!res.headersSent) res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/cron/close-expired-campaigns?key=...  (add &dry=1 to only count, nothing changes)
router.get('/close-expired-campaigns', async (req, res) => {
  if (req.query.key !== process.env.CRON_SECRET_KEY) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const { closeExpiredOpenings } = require('../services/closeExpiredOpenings');
    const result = await closeExpiredOpenings({ dry: req.query.dry === '1' });
    if (!result.dry) console.log(`[CRON] Closed ${result.closed} expired campaign(s).`);
    res.json(result);
  } catch (error) {
    console.error('close-expired-campaigns error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/refresh-rotation', refreshRotationValues);

module.exports = router;
