const cron = require('node-cron');
const Brand = require('../models/Brand');
const {
  getBasicProfile,
  decryptToken,
} = require('../services/instagram.service');

const syncBrandProfiles = () => {
  // every 3 days at 3am IST (9:30pm UTC)
  cron.schedule('30 21 */3 * *', async () => {
    console.log('[CRON] Starting brand profile sync...');

    try {
      const brands = await Brand.find({ 'instagram.isVerified': true });

      await Promise.allSettled(
        brands.map(async (brand) => {
          try {
            const accessToken = decryptToken(brand.instagram.accessToken);
            const profile = await getBasicProfile(accessToken);

            await Brand.findByIdAndUpdate(brand._id, {
              'instagram.followersCount': profile.followersCount,
              'instagram.profilePicUrl': profile.profilePicUrl,
              'instagram.handle': profile.username,
            });
          } catch (err) {
            console.error(
              `[CRON] Failed brand ${brand._id}:`,
              err.message
            );
          }
        })
      );

      console.log('[CRON] Brand sync complete');
    } catch (err) {
      console.error('[CRON] Brand sync failed:', err.message);
    }
  });
};

module.exports = syncBrandProfiles;