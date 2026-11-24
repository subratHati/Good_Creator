// scripts/verifyExistingBrands.js
//
// ONE-TIME migration. Run it BEFORE you deploy the brand verification update.
//
// From now on a brand is "verified" only when its record says
// verification.status = 'verified', and a brand with no status counts as NOT
// verified. Every brand that already exists on GoodCreator was working before,
// so this marks all of them as verified. Without it, every existing brand would
// suddenly be locked out of campaigns and messages.
//
// Usage (from the server folder):
//   node scripts/verifyExistingBrands.js
//
// Safe to run more than once: it only touches brands that have no status yet,
// so brands that registered after the update (status "pending") are never
// changed by it.

require('dotenv').config();
const mongoose = require('mongoose');
const Brand = require('../models/Brand');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_ATLAS_URI);
    console.log('Connected to database.');

    const filter = { 'verification.status': { $exists: false } };
    const missing = await Brand.countDocuments(filter);
    console.log(`Found ${missing} brand(s) with no verification status.`);

    if (missing > 0) {
      const result = await Brand.updateMany(filter, {
        $set: {
          'verification.status': 'verified',
          'verification.note': '',
          'verification.reviewedAt': new Date(),
        },
      });
      console.log(`Marked ${result.modifiedCount} existing brand(s) as verified.`);
    }

    const verified = await Brand.countDocuments({ 'verification.status': 'verified' });
    const pending = await Brand.countDocuments({ 'verification.status': 'pending' });
    console.log(`Now: ${verified} verified, ${pending} pending.`);
    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
