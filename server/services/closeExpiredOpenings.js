const Opening = require('../models/Opening');

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// midnight at the start of today, India time
const startOfTodayIST = () => {
  const istNow = new Date(Date.now() + IST_OFFSET_MS);
  istNow.setUTCHours(0, 0, 0, 0);
  return new Date(istNow.getTime() - IST_OFFSET_MS);
};

// A campaign closes once its deadline DAY is over (so a campaign with deadline 30 Oct
// stays open all of 30 Oct). It becomes "closed", the same state as a manual close.
// Pass { dry: true } to only count them.
const closeExpiredOpenings = async ({ dry = false } = {}) => {
  const filter = { status: 'active', deadline: { $lt: startOfTodayIST() } };
  if (dry) return { dry: true, wouldClose: await Opening.countDocuments(filter) };
  const res = await Opening.updateMany(filter, { $set: { status: 'closed' } });
  return { dry: false, closed: res.modifiedCount };
};

module.exports = { closeExpiredOpenings, startOfTodayIST };