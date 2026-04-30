const cron = require('node-cron');
const Creator = require('../models/Creator');
const Brand = require('../models/Brand');
const {
  refreshToken,
  encryptToken,
  decryptToken,
} = require('../services/instagram.service');

const refreshInstagramTokens = () => {
  // runs every day at 1am IST (7:30pm UTC)
  cron.schedule('30 19 * * *', async () => {
    console.log('[CRON] Checking tokens for refresh...');

    const fiftyDaysAgo = new Date(
      Date.now() - 50 * 24 * 60 * 60 * 1000
    );

    try {
      const creators = await Creator.find({
        'instagram.isConnected': true,
        'instagram.tokenRefreshedAt': { $lt: fiftyDaysAgo },
      });

      for (const creator of creators) {
        try {
          const oldToken = decryptToken(creator.instagram.accessToken);
          const newToken = await refreshToken(oldToken);

          await Creator.findByIdAndUpdate(creator._id, {
            'instagram.accessToken': encryptToken(newToken),
            'instagram.tokenRefreshedAt': new Date(),
          });
        } catch (err) {
          await Creator.findByIdAndUpdate(creator._id, {
            'instagram.isConnected': false,
          });
          console.error(
            `[CRON] Token refresh failed for creator ${creator._id}`
          );
        }
      }

      const brands = await Brand.find({
        'instagram.isVerified': true,
        'instagram.tokenRefreshedAt': { $lt: fiftyDaysAgo },
      });

      for (const brand of brands) {
        try {
          const oldToken = decryptToken(brand.instagram.accessToken);
          const newToken = await refreshToken(oldToken);

          await Brand.findByIdAndUpdate(brand._id, {
            'instagram.accessToken': encryptToken(newToken),
            'instagram.tokenRefreshedAt': new Date(),
          });
        } catch (err) {
          await Brand.findByIdAndUpdate(brand._id, {
            'instagram.isVerified': false,
          });
          console.error(
            `[CRON] Token refresh failed for brand ${brand._id}`
          );
        }
      }

      console.log('[CRON] Token refresh complete');
    } catch (err) {
      console.error('[CRON] Token refresh job failed:', err.message);
    }
  });
};

module.exports = refreshInstagramTokens;