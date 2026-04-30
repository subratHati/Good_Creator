const cron = require('node-cron');
const Creator = require('../models/Creator');
const {
  getCreatorInsights,
  decryptToken,
} = require('../services/instagram.service');

const syncCreatorInsights = () => {
  // runs every day at 2am IST (8:30pm UTC)
  cron.schedule('30 20 * * *', async () => {
    console.log('[CRON] Starting creator insight sync...');

    try {
      const creators = await Creator.find({
        'instagram.isConnected': true,
      });
      console.log(`[CRON] Syncing ${creators.length} creators`);

      const batchSize = 10;
      for (let i = 0; i < creators.length; i += batchSize) {
        const batch = creators.slice(i, i + batchSize);

        await Promise.allSettled(
          batch.map(async (creator) => {
            try {
              const accessToken = decryptToken(creator.instagram.accessToken);
              const insights = await getCreatorInsights(
                accessToken,
                creator.instagram.userId
              );

              await Creator.findByIdAndUpdate(creator._id, {
                'instagram.followersCount': insights.followersCount,
                'instagram.avgLikes': insights.avgLikes,
                'instagram.avgViews': insights.avgViews,
                'instagram.avgReach': insights.avgReach,
                'instagram.engagementRate': insights.engagementRate,
                'instagram.lastSynced': new Date(),
              });
            } catch (err) {
              console.error(
                `[CRON] Failed creator ${creator._id}:`,
                err.message
              );
            }
          })
        );

        if (i + batchSize < creators.length) {
          await new Promise((res) => setTimeout(res, 2000));
        }
      }

      console.log('[CRON] Creator sync complete');
    } catch (err) {
      console.error('[CRON] Creator sync failed:', err.message);
    }
  });
};

module.exports = syncCreatorInsights;