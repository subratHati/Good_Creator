// scripts/dumpOtherCategoryBios.js
//
// TEMPORARY, one-time diagnostic script. Prints ONLY the bio text of
// every creator who has 'other' in their categories array — meant
// purely for manual review to spot recurring themes worth turning
// into real, dedicated categories. Delete this script once done.
//
// IMPORTANT: your terminal's scrollback buffer likely can't show all
// 600+ entries at once (older lines scroll off and become invisible,
// even though the script itself runs correctly on all of them) — use
// the --save flag to write everything to a file instead, which has no
// such limit and is far easier to scroll/search through completely.
//
// Usage:
//   node scripts/dumpOtherCategoryBios.js --save
//   (then open ./other-category-bios.txt in any text editor)

require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');
const Creator = require('../models/Creator');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_ATLAS_URI);
    console.log('Connected to database.\n');

    const creators = await Creator.find({ categories: { $in: ['other'] } })
      .select('bio')
      .sort({ createdAt: -1 });

    console.log(`Found ${creators.length} creator(s) with 'other' in their categories.\n`);

    // only bios with actual text — skip blank ones entirely, since an
    // empty bio gives no pattern signal at all
    const bios = creators
      .map(c => c.bio?.trim())
      .filter(bio => bio);

    console.log(`${bios.length} of them have a non-empty bio.\n`);
    console.log('─'.repeat(60));

    bios.forEach((bio, i) => {
      console.log(`${i + 1}. ${bio}`);
    });

    if (process.argv.includes('--save')) {
      const outPath = './other-category-bios.txt';
      fs.writeFileSync(outPath, bios.map((b, i) => `${i + 1}. ${b}`).join('\n'));
      console.log(`\nSaved all ${bios.length} bios to ${outPath}`);
    }
  } catch (err) {
    console.error('Script failed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
