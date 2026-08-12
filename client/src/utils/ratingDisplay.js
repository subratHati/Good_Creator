// utils/ratingDisplay.js
//
// Converts a raw 1-10 average rating (stored in the database, per Review.js)
// into a 1-5 half-star display value, plus the color band that goes with it.
//
// Conversion: divide by 2, then round UP to the next 0.5 step (never down,
// never to the nearest — always up). Floored at a minimum of 1 star, even
// though the raw math could technically produce 0.5 for a very low rating.
//
// Color bands (on the 1-5 display scale):
//   1   - 2.5  : orange
//   3   - 3.5  : yellow
//   4   - 4.5  : green
//   5          : blue, with a gold border to visually set it apart as the
//                single highest possible rating

// returns a plain number (e.g. 3.5) ready to display, or null if there's
// no rating yet (raw is 0/undefined) — callers should skip rendering the
// badge entirely when this is null
export const formatDisplayRating = (raw10Scale) => {
  if (!raw10Scale || raw10Scale <= 0) return null;

  const scale5 = raw10Scale / 2;
  const roundedUp = Math.ceil(scale5 * 2) / 2;

  // floor at 1 star minimum, per product decision
  return Math.max(roundedUp, 1);
};

// returns { bg, color, border, isGold } for a given 1-5 display value
export const getRatingColorBand = (fiveStarValue) => {
  if (fiveStarValue >= 5) {
    return { bg: '#EFF6FF', color: '#1D4ED8', border: '#FACC15', isGold: true }; // blue + gold border
  }
  if (fiveStarValue >= 4) {
    return { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0', isGold: false }; // green
  }
  if (fiveStarValue >= 3) {
    return { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A', isGold: false }; // yellow
  }
  // 1 - 2.5
  return { bg: '#FFF7ED', color: '#9A3412', border: '#FED7AA', isGold: false }; // orange
};
