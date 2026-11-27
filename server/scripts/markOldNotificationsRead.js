// scripts/markOldNotificationsRead.js
//
// ONE-TIME clean-up. Run it right after you deploy the notification bell fix.
//
// The bell's red number now counts notifications that are really unread on the
// server. Until now only the "Notifications" page ever marked one as read, so
// almost every old notification is still stored as unread - without this clean-up
// every person would suddenly see a big red number made of old notifications.
//
// It marks every notification older than N days as read (default 3). Newer ones
// stay unread, so nobody loses something recent.
//
// Usage (from the server folder):
//   node scripts/markOldNotificationsRead.js              <- only counts, changes nothing
//   node scripts/markOldNotificationsRead.js --days 7     <- count with another age
//   node scripts/markOldNotificationsRead.js --apply      <- really do it
//
// Safe to run more than once. It only ever sets isRead to true; nothing is deleted.

require('dotenv').config();
const mongoose = require('mongoose');
const Notification = require('../models/Notification');

const main = async () => {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const i = args.indexOf('--days');
  const days = i >= 0 ? Number(args[i + 1]) : 3;
  if (!Number.isFinite(days) || days < 0) { console.error('--days must be a number, for example --days 3'); process.exitCode = 1; return; }
  try {
    await mongoose.connect(process.env.MONGO_ATLAS_URI);
    console.log('Connected to database.');
    const before = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const filter = { isRead: false, createdAt: { $lt: before } };
    const [unreadAll, old] = await Promise.all([Notification.countDocuments({ isRead: false }), Notification.countDocuments(filter)]);
    console.log(`Unread notifications now: ${unreadAll}`);
    console.log(`Older than ${days} day(s) and unread: ${old}  <- these would be marked as read`);
    console.log(`Newer ones that stay unread: ${unreadAll - old}`);
    if (!apply) { console.log('\nDRY RUN: nothing was changed. Run again with --apply to do it.'); return; }
    const res = await Notification.updateMany(filter, { isRead: true }, { timestamps: false });
    console.log(`Done. Marked ${res.modifiedCount != null ? res.modifiedCount : res.nModified} notification(s) as read.`);
  } catch (err) {
    console.error('Failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

main();
