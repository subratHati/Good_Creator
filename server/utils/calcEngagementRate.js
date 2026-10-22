// Engagement rate = interactions ÷ reach (people actually reached), as a percentage.
// Dividing by followers explodes for small accounts whose reels reach non-followers.
// Falls back to views, then followers, when reach is unknown. Capped at 100.
const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const MIN_BASE = 300; // very small samples are noisy, so never divide by less than this

const calcEngagementRate = ({ avgLikes, avgComments, avgSaved, avgShares, avgReach, avgViews, followersCount }) => {
  const interactions = n(avgLikes) + n(avgComments) + n(avgSaved) + n(avgShares);
  if (interactions <= 0) return 0;
  const base = n(avgReach) > 0 ? n(avgReach) : n(avgViews) > 0 ? n(avgViews) : n(followersCount);
  if (base <= 0) return 0;
  const safeBase = Math.max(base, MIN_BASE);
  return Math.round(Math.min((interactions / safeBase) * 100, 100) * 100) / 100;
};

module.exports = calcEngagementRate;