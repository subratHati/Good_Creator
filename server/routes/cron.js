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

router.get('/refresh-rotation', refreshRotationValues);

module.exports = router;
