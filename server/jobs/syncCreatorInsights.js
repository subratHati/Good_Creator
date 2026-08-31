const cron = require('node-cron');
const axios = require('axios');
const Creator = require('../models/Creator');
const { decryptToken, encryptToken } = require('../services/instagram.service');
const { calculateReelMetrics, calculateEngagementRate } = require('../controllers/instagram.controller');
const calculateQualityScore = require('../utils/calculateQualityScore');

// Reuses the EXACT same sync logic as the manual "Sync Now" button and the
// initial OAuth connect flow (calculateReelMetrics/calculateEngagementRate,
// imported from instagram.controller.js) — this used to be a separate,
// older implementation (getCreatorInsights in instagram.service.js) that
// had fallen out of sync with the real, working logic and was failing
// with 400s against Meta's current API. Now there's exactly one sync
// implementation, reused everywhere sync happens.
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
              const igUserId = creator.instagram.userId;

              // refresh the token first, same as the manual sync path —
              // this is very likely part of why the old job was failing,
              // since Instagram long-lived tokens expire and need
              // periodic refreshing to keep working
              let freshToken = accessToken;
              try {
                const refreshRes = await axios.get('https://graph.instagram.com/refresh_access_token', {
                  params: { grant_type: 'ig_refresh_token', access_token: accessToken },
                });
                freshToken = refreshRes.data.access_token || accessToken;
              } catch {
                // refresh failing isn't fatal — fall back to the existing
                // token, same as the manual sync path does
              }

              const profileRes = await axios.get('https://graph.instagram.com/v21.0/me', {
                params: { fields: 'followers_count', access_token: freshToken },
              });
              const followersCount = profileRes.data.followers_count || 0;

              const metrics = await calculateReelMetrics(igUserId, freshToken);
              const engagementRate = calculateEngagementRate(metrics, followersCount);

              const updated = await Creator.findByIdAndUpdate(creator._id, {
                'instagram.accessToken': encryptToken(freshToken),
                'instagram.followersCount': followersCount,
                'instagram.avgLikes': metrics.avgLikes,
                'instagram.avgComments': metrics.avgComments,
                'instagram.avgReach': metrics.avgReach,
                'instagram.avgViews': metrics.avgViews,
                'instagram.avgSaved': metrics.avgSaved,
                'instagram.avgShares': metrics.avgShares,
                'instagram.engagementRate': engagementRate,
                'instagram.lastSynced': new Date(),
                'instagram.tokenRefreshedAt': new Date(),
              }, { new: true });

              if (updated) {
                const newScore = await calculateQualityScore(updated);
                await Creator.findByIdAndUpdate(updated._id, { qualityScore: newScore });
              }
            } catch (err) {
              console.error(
                `[CRON] Failed creator ${creator._id}:`,
                err.response?.data || err.message
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
