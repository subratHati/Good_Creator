// scripts/backfillReviewCount.js
//
// One-time migration. Sets reviewCount on every existing creator,
// counting their actual reviews from the Review collection — same
// pattern as the earlier avgRating backfill, for a field added after
// most Creator documents already existed.
//
// Usage:
//   node scripts/backfillReviewCount.js

require('dotenv').config();
const mongoose = require('mongoose');
const Creator = require('../models/Creator');
const Review = require('../models/Review');

const BATCH_SIZE = 50;

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_ATLAS_URI);
    console.log('Connected to database.');

    const totalCreators = await Creator.countDocuments();
    console.log(`Found ${totalCreators} creator(s) to process.`);

    let processed = 0;

    for (let skip = 0; skip < totalCreators; skip += BATCH_SIZE) {
      const batch = await Creator.find().skip(skip).limit(BATCH_SIZE).select('_id');

      await Promise.all(
        batch.map(async (creator) => {
          const count = await Review.countDocuments({ creatorId: creator._id });
          await Creator.findByIdAndUpdate(creator._id, { reviewCount: count });
        })
      );

      processed += batch.length;
      console.log(`Processed ${processed}/${totalCreators}...`);
    }

    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
