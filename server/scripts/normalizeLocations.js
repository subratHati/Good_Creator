// scripts/normalizeLocations.js
//
// Tidies up the state and city that creators and brands typed in before the
// drop-down lists existed: "bombay" -> "Mumbai", "Orissa" -> "Odisha", "KA" ->
// "Karnataka", "Bangalore, Karnataka" -> Bengaluru / Karnataka, and so on.
//
// It only writes a location when it is SURE, and it NEVER deletes anything:
//   - sure = the state is known and the city is in our list (or a believable town name):
//     "Bangalore" / "Karnatka" -> Bengaluru / Karnataka, "Majalgaon" / "maharastra" -> Majalgaon / Maharashtra
//   - not sure (name not recognised, city is in another state than the one typed, city text
//     is junk like "India" or "Select city") -> the location is left EXACTLY as typed and the
//     profile gets a "please set your location" flag. The app then shows that person a pop-up
//     on every login/visit until they pick a proper location (the flag is cleared when they do)
//   - before changing anything, the old values of every profile are saved in a backup
//     file, and --undo puts them back (flags included)
//
// Usage (from the server folder):
//   node scripts/normalizeLocations.js                    DRY RUN: only writes the reports, changes nothing
//   node scripts/normalizeLocations.js --apply            makes the changes (asks you to confirm first)
//   node scripts/normalizeLocations.js --undo <backup file>   puts the old values back
//   add  --overrides <file.json>  to teach it names it could not match (see the template it writes)
//
// Reports are written to server/location-reports/<date and time>/ . They contain no
// names or emails, only the typed places and how many profiles have each. Do not
// commit that folder to git - delete it when you are done.

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { fixLocation, assessResult, normKey, resolveState, resolveCity } = require('../utils/places');

const MODELS = ['Creator', 'Brand'];
const q = (s) => `"${s}"`;

// ── overrides: names the script could not match, with the answer filled in by you ──
// { "state": { "typed text": "Official State" },
//   "city":  { "typed text": "Official City" },
//   "pair":  [ { "city": "typed", "state": "typed", "newCity": "Official City", "newState": "Official State" } ] }
const loadOverrides = (file) => {
  if (!file) return { state: new Map(), city: new Map(), pair: new Map() };
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const out = { state: new Map(), city: new Map(), pair: new Map() };
  Object.entries(raw.state || {}).forEach(([k, v]) => { if (String(v).trim()) out.state.set(normKey(k), String(v).trim()); });
  Object.entries(raw.city || {}).forEach(([k, v]) => { if (String(v).trim()) out.city.set(normKey(k), String(v).trim()); });
  (raw.pair || []).forEach((p) => { if (p && (p.newCity || p.newState)) out.pair.set(`${normKey(p.city)}|${normKey(p.state)}`, p); });
  return out;
};

// what one saved (city, state) should become
const decide = (city, state, overrides) => {
  const pair = overrides.pair.get(`${normKey(city)}|${normKey(state)}`);
  // "changed" must be measured against what is saved now, not against the text we were told to use
  const finish = (fixed, via) => {
    const changed = fixed.city !== city || fixed.state !== state;
    const status = fixed.status === 'ok' && changed ? 'fixed' : fixed.status;
    return { ...fixed, status, changed, via };
  };
  if (pair) {
    return finish(fixLocation({ city: String(pair.newCity || '').trim() || city, state: String(pair.newState || '').trim() || state }), 'your override (pair)');
  }
  const st = overrides.state.get(normKey(state));
  const ct = overrides.city.get(normKey(city));
  if (st || ct) return finish(fixLocation({ city: ct || city, state: st || state }), 'your override');
  return fixLocation({ city, state });
};

const methodText = (r) => [r.cityMethod && `city: ${r.cityMethod}`, r.stateMethod && `state: ${r.stateMethod}`, r.via].filter(Boolean).join(', ');

const run = async ({ models, apply = false, overrides = loadOverrides(), outDir, log = console.log, now = new Date() }) => {
  // 1. read every profile once, grouped by the typed (city, state) pair
  const pairs = new Map();
  const totals = {};
  for (const name of MODELS) {
    totals[name] = 0;
    const cursor = models[name].find({}).select('location locationReview').lean().cursor();
    for await (const doc of cursor) {
      totals[name]++;
      const rawCity = doc.location ? doc.location.city : undefined;
      const rawState = doc.location ? doc.location.state : undefined;
      const key = `${rawCity == null ? '' : rawCity}\u0000${rawState == null ? '' : rawState}`;
      if (!pairs.has(key)) pairs.set(key, { city: rawCity == null ? '' : String(rawCity), state: rawState == null ? '' : String(rawState), docs: [] });
      pairs.get(key).docs.push({ model: name, id: doc._id, rawCity, rawState, flagged: doc.locationReview === true });
    }
  }

  // 2. decide what each distinct pair becomes: write it (sure), ask the person (not sure), or nothing
  const groups = [];
  for (const p of pairs.values()) {
    const r = decide(p.city, p.state, overrides);
    const a = assessResult(r, { city: p.city, state: p.state });
    groups.push({ ...p, result: r, assess: a, verdict: a.verdict, count: p.docs.length, byModel: MODELS.map((m) => [m, p.docs.filter((d) => d.model === m).length]).filter(([, n]) => n) });
  }
  const changes = groups.filter((g) => g.verdict === 'write').sort((a, b) => b.count - a.count);
  const reviews = groups.filter((g) => g.verdict === 'review').sort((a, b) => b.count - a.count);

  // 3. reports
  fs.mkdirSync(outDir, { recursive: true });
  const who = (g) => g.byModel.map(([m, n]) => `${n} ${m === 'Creator' ? 'creator' : 'brand'}${n > 1 ? 's' : ''}`).join(' + ');
  const count = (list, f = () => true) => list.filter(f).reduce((s, g) => s + g.count, 0);

  const changeLines = [
    'LOCATIONS THAT ARE (OR WOULD BE) CHANGED - only the ones we are sure about',
    '"typed city" / "typed state"   ->   "official city" / "official state"',
    '',
    ...(changes.length ? changes.map((g) => `${String(g.count).padStart(4)} profile(s)  ${q(g.city)} / ${q(g.state)}   ->   ${q(g.result.city)} / ${q(g.result.state)}    [${methodText(g.result)}]  (${who(g)})${g.result.notes.length ? '  note: ' + g.result.notes.join('; ') : ''}`) : ['(none)']),
  ];
  fs.writeFileSync(path.join(outDir, '1-changes.txt'), changeLines.join('\n') + '\n');

  const section = (title, help, group) => {
    const list = reviews.filter((g) => g.assess.group === group);
    return [`${title}   (${count(list)} profiles)`, help, '', ...(list.length ? list.map((g) => `${String(g.count).padStart(4)} profile(s)  ${q(g.city)} / ${q(g.state)}${g.assess.reason ? '    -> ' + g.assess.reason : ''}  (${who(g)})`) : ['(none)']), ''];
  };
  const reviewLines = [
    'PROFILES THAT WILL BE ASKED TO SET THEIR LOCATION (pop-up)',
    '"typed city" / "typed state"   -   their saved location is NOT changed; they pick a proper one when they next open the app',
    '',
    ...section('A) NOT RECOGNISED / OUTSIDE INDIA / EMPTY', 'We could not tell what place this is.', 'nomatch'),
    ...section('B) CITY IS IN A DIFFERENT STATE THAN THE ONE TYPED', 'We do not guess which of the two is right.', 'conflict'),
    ...section('C) STATE IS KNOWN BUT THE CITY TEXT IS NOT A CITY', 'For example "India", "Select city", two places in one box, a number or an address.', 'unclear'),
  ];
  fs.writeFileSync(path.join(outDir, '2-will-ask-to-set-location.txt'), reviewLines.join('\n') + '\n');

  // a file to fill in: put the right name after each typed text, then run again with --overrides
  const template = { _help: 'Fill in the official name after each typed text, save this file, and run the script again with --overrides <this file>. Leave "" to skip one. An answer you give here is trusted, so that profile is changed instead of being asked.', state: {}, city: {}, pair: [] };
  reviews.forEach((g) => {
    if (g.result.status === 'unmatched') {
      if (g.state && !resolveState(g.state)) template.state[g.state] = template.state[g.state] || '';
      if (g.city && !resolveCity(g.city, '', { allowFuzzy: false })) template.city[g.city] = template.city[g.city] || '';
      // a real city that exists in several states and has no state: say which state it is
      else if (g.city && !g.state) template.pair.push({ city: g.city, state: g.state, newCity: '', newState: '' });
    } else if (g.result.status === 'conflict') {
      template.pair.push({ city: g.city, state: g.state, newCity: '', newState: '' });
    }
  });
  fs.writeFileSync(path.join(outDir, 'overrides-template.json'), JSON.stringify(template, null, 2) + '\n');

  const profilesTotal = totals.Creator + totals.Brand;
  const nothing = groups.filter((g) => g.verdict === 'ok');
  const summary = [
    `Checked ${totals.Creator} creators and ${totals.Brand} brands (${profilesTotal} profiles, ${groups.length} different typed locations).`,
    `  already correct, nothing to do ......... ${count(nothing)}`,
    `  sure, will be set to the official name . ${count(changes)}   (1-changes.txt)`,
    `  not sure, will see the pop-up .......... ${count(reviews)}   (2-will-ask-to-set-location.txt)`,
    `       not recognised / abroad / empty ... ${count(reviews, (g) => g.assess.group === 'nomatch')}`,
    `       city in a different state ......... ${count(reviews, (g) => g.assess.group === 'conflict')}`,
    `       city text is not a city ........... ${count(reviews, (g) => g.assess.group === 'unclear')}`,
  ];
  fs.writeFileSync(path.join(outDir, '0-summary.txt'), summary.join('\n') + '\n');
  summary.forEach((l) => log(l));
  log(`Reports written to: ${outDir}`);

  // 4. apply. Every write only happens if the profile still has the same old location text.
  const result = { totals, groups, changes, reviews, applied: 0, skipped: 0, backupFile: null, flagged: 0, unflagged: 0 };
  const plan = [];   // { model, id, rawCity, rawState, newCity, newState, oldFlag, newFlag }
  groups.forEach((g) => g.docs.forEach((d) => {
    if (g.verdict === 'write') plan.push({ ...d, newCity: g.result.city, newState: g.result.state, newFlag: false });
    else if (g.verdict === 'review' && !d.flagged) plan.push({ ...d, newCity: null, newState: null, newFlag: true });
    else if (g.verdict === 'ok' && d.flagged) plan.push({ ...d, newCity: null, newState: null, newFlag: false }); // fine now: lift an old flag
  }));
  result.plan = plan;
  result.flagged = plan.filter((p) => p.newFlag).length;
  result.unflagged = plan.filter((p) => !p.newFlag && p.flagged).length;
  if (!apply) { log('\nDRY RUN: nothing was changed. Run again with --apply to make the changes.'); return result; }

  const backup = [];
  const ops = { Creator: [], Brand: [] };
  plan.forEach((p) => {
    const oldLoc = { city: p.rawCity === undefined ? null : p.rawCity, state: p.rawState === undefined ? null : p.rawState };
    const writes = p.newCity !== null;
    backup.push({ model: p.model, id: String(p.id), old: { ...oldLoc, flag: p.flagged }, new: writes ? { city: p.newCity, state: p.newState, flag: p.newFlag } : { ...oldLoc, flag: p.newFlag } });
    const set = { locationReview: p.newFlag };
    if (writes) { set['location.city'] = p.newCity; set['location.state'] = p.newState; }
    ops[p.model].push({ updateOne: { filter: { _id: p.id, 'location.city': oldLoc.city, 'location.state': oldLoc.state }, update: { $set: set } } });
  });
  if (!backup.length) { log('Nothing to change.'); return result; }
  const backupFile = path.join(outDir, 'backup-old-values.json');
  fs.writeFileSync(backupFile, JSON.stringify({ createdAt: now.toISOString(), entries: backup }, null, 1));
  result.backupFile = backupFile;
  log(`Backup of the old values saved: ${backupFile}`);

  for (const name of MODELS) {
    for (let i = 0; i < ops[name].length; i += 500) {
      const batch = ops[name].slice(i, i + 500);
      // timestamps:false -> the profile's "updated" date is not touched
      const res = await models[name].bulkWrite(batch, { ordered: false, timestamps: false });
      const done = res.modifiedCount != null ? res.modifiedCount : res.nModified || 0;
      result.applied += done; result.skipped += batch.length - done;
    }
  }
  log(`Updated ${result.applied} profile(s) (${result.flagged} marked for the pop-up). Skipped ${result.skipped} (edited by the user while the script ran - run it again to catch them).`);
  return result;
};

// puts the old values back from a backup file
const undo = async ({ models, file, log = console.log }) => {
  const { entries } = JSON.parse(fs.readFileSync(file, 'utf8'));
  let restored = 0; let skipped = 0;
  for (const name of MODELS) {
    const ops = entries.filter((e) => e.model === name).map((e) => {
      const set = { locationReview: e.old.flag === true };
      // a flag-only entry has the same city/state before and after: do not touch the location then
      if (e.old.city !== e.new.city || e.old.state !== e.new.state) {
        set['location.city'] = e.old.city == null ? '' : e.old.city;
        set['location.state'] = e.old.state == null ? '' : e.old.state;
      }
      return { updateOne: { filter: { _id: e.id, 'location.city': e.new.city, 'location.state': e.new.state }, update: { $set: set } } };
    });
    for (let i = 0; i < ops.length; i += 500) {
      const batch = ops.slice(i, i + 500);
      const res = await models[name].bulkWrite(batch, { ordered: false, timestamps: false });
      const done = res.modifiedCount != null ? res.modifiedCount : res.nModified || 0;
      restored += done; skipped += batch.length - done;
    }
  }
  log(`Put back ${restored} profile(s). Skipped ${skipped} (changed again since).`);
  return { restored, skipped };
};

const ask = (question) => new Promise((resolve) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question(question, (a) => { rl.close(); resolve(a.trim()); });
});

const main = async () => {
  require('dotenv').config();
  const mongoose = require('mongoose');
  const args = process.argv.slice(2);
  const flag = (name) => args.includes(name);
  const value = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
  try {
    await mongoose.connect(process.env.MONGO_ATLAS_URI);
    console.log('Connected to database.');
    const models = { Creator: require('../models/Creator'), Brand: require('../models/Brand') };

    if (flag('--undo')) {
      const file = value('--undo');
      if (!file) throw new Error('Give the backup file: --undo <file>');
      if (!flag('--yes') && (await ask('This puts the OLD location values back. Type UNDO to continue: ')) !== 'UNDO') { console.log('Cancelled.'); return; }
      await undo({ models, file });
      return;
    }

    const apply = flag('--apply');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outDir = path.join(__dirname, '..', 'location-reports', stamp);
    const overrides = loadOverrides(value('--overrides'));
    // look first (always), then ask before changing anything
    const preview = await run({ models, apply: false, overrides, outDir, log: () => { } });
    if (apply) {
      const n = preview.changes.reduce((s, g) => s + g.count, 0);
      console.log(`\nAbout to set ${n} location(s) to their official name and mark ${preview.flagged} profile(s) for the "please set your location" pop-up, in the database that .env points to.`);
      if (!flag('--yes') && (await ask('Type APPLY to continue: ')) !== 'APPLY') { console.log('Cancelled. Nothing was changed.'); return; }
    }
    await run({ models, apply, overrides, outDir });
  } catch (err) {
    console.error('Failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

if (require.main === module) main();

module.exports = { run, undo, loadOverrides, decide };
