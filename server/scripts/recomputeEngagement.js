require('dotenv').config();
const mongoose = require('mongoose');
const Creator = require('../models/Creator');
const calcEngagementRate = require('../utils/calcEngagementRate');

const APPLY = process.argv.includes('--apply');

(async () => {
  await mongoose.connect(process.env.MONGO_ATLAS_URI);
  const cursor = Creator.find({})
    .select('name instagram.followersCount instagram.avgReach instagram.avgViews instagram.avgLikes instagram.avgComments instagram.avgSaved instagram.avgShares instagram.engagementRate')
    .lean()
    .cursor();

  let total = 0, skipped = 0, changed = 0;
  const samples = [];
  const ops = [];

  for await (const c of cursor) {
    total++;
    const ig = c.instagram || {};
    const hasData = (ig.avgLikes || 0) + (ig.avgComments || 0) + (ig.avgSaved || 0) + (ig.avgShares || 0) > 0;
    if (!hasData) { skipped++; continue; }
    const next = calcEngagementRate(ig);
    const prev = ig.engagementRate || 0;
    if (Math.abs(next - prev) < 0.005) continue;
    changed++;
    if (samples.length < 15) samples.push(`${c.name}: ${prev}% -> ${next}%`);
    ops.push({ updateOne: { filter: { _id: c._id }, update: { $set: { 'instagram.engagementRate': next } } } });
    if (APPLY && ops.length >= 500) { await Creator.bulkWrite(ops); ops.length = 0; }
  }
  if (APPLY && ops.length) await Creator.bulkWrite(ops);

  console.log(`Creators: ${total}, no interaction data (left alone): ${skipped}, to change: ${changed}`);
  console.log(samples.join('\n'));
  console.log(APPLY ? 'APPLIED.' : 'Dry run only. Re-run with --apply to save.');
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });