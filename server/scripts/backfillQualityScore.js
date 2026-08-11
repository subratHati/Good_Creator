// scripts/backfillQualityScore.js
//
// One-time migration. Unlike earlier backfills that just set a static
// default value, this one genuinely COMPUTES each existing creator's
// real qualityScore, using their actual current profile completeness,
// engagement rate, and average review rating — via the same
// calculateQualityScore function the app uses going forward for any
// live updates (profile edits, Instagram sync, new reviews).
//
// Processed in batches rather than one giant Promise.all, since
// calculateQualityScore does a database query (fetching reviews) per
// creator — at 1,300+ creators, running all of those concurrently at
// once would open far too many simultaneous connections. Batching keeps
// this safe and predictable regardless of how large the creator base is.
//
// Usage:
//   node scripts/backfillQualityScore.js
//
// Safe to run multiple times — it recalculates every creator's score
// fresh each time, which is harmless (just redundant if nothing changed
// since the last run).

require('dotenv').config();
const mongoose = require('mongoose');
const Creator = require('../models/Creator');
const calculateQualityScore = require('../utils/calculateQualityScore');

const BATCH_SIZE = 50;

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_ATLAS_URI);
    console.log('Connected to database.');

    const totalCreators = await Creator.countDocuments();
    console.log(`Found ${totalCreators} creator(s) to process.`);

    let processed = 0;
    let scoreSum = 0;

    for (let skip = 0; skip < totalCreators; skip += BATCH_SIZE) {
      const batch = await Creator.find().skip(skip).limit(BATCH_SIZE);

      await Promise.all(
        batch.map(async (creator) => {
          const score = await calculateQualityScore(creator);
          await Creator.findByIdAndUpdate(creator._id, { qualityScore: score });
          scoreSum += score;
        })
      );

      processed += batch.length;
      console.log(`Processed ${processed}/${totalCreators}...`);
    }

    const avgScore = totalCreators > 0 ? (scoreSum / totalCreators).toFixed(2) : 0;
    console.log(`Migration complete. Average qualityScore across all creators: ${avgScore}`);
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
