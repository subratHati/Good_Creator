// utils/calculateQualityScore.js
//
// Computes a creator's stored qualityScore — combining engagement rate,
// profile completeness, average rating, and (TEMPORARILY) followers +
// avg views, into one number. This is deliberately NOT calculated at
// browse-time; it's calculated once whenever the underlying data changes
// (profile update, Instagram sync, new review) and stored directly on
// the Creator document. This is what keeps browse queries fast at
// scale — the expensive part is already done by the time a brand
// searches.
//
// ─────────────────────────────────────────────────────────────────────
// TEMPORARY, as of August 2026: engagementRate and reviews are still
// sparse across most of the creator base (Instagram OAuth connect is
// currently broken, and the review system just launched), so the score
// leans on followersCount and avgViews in the meantime — both of which
// nearly every creator has, since they can be entered manually.
//
// REMOVE the followers/avgViews components once real Instagram
// connection is working broadly and creators have accumulated genuine
// engagement rates and reviews — at that point this score should be
// driven by engagement + completeness + rating alone, as originally
// designed, not raw follower/view counts (which reward audience SIZE,
// not audience QUALITY — the opposite of what this score is meant to
// measure long-term).
// ─────────────────────────────────────────────────────────────────────
//
// Practical range: roughly 0–12 for a strong, complete, well-reviewed
// creator (once the temporary followers/avgViews components are
// removed). Capped explicitly so one unusually high input (e.g. a 40%
// engagement outlier, or a creator with 500K followers) can't dominate
// the whole score.
const Review = require('../models/Review');

const ENGAGEMENT_WEIGHT = 0.5;
const ENGAGEMENT_CAP = 20; // engagement rates above 20% contribute no extra points — prevents outliers from skewing everything
const PROFILE_COMPLETE_POINTS = 1.5;
const RATING_WEIGHT = 0.3; // rating is 1–10 scale, so max contribution here is 3

// TEMPORARY weights — see note above. Using log scale so a creator with
// 500K followers doesn't completely dwarf one with 5K; the difference
// between 1K and 10K followers matters more, proportionally, than the
// difference between 100K and 109K.
const FOLLOWERS_WEIGHT = 0.6;
const FOLLOWERS_CAP = 5; // log10(100,000) = 5 — caps contribution around the 100K-follower mark
const AVG_VIEWS_WEIGHT = 0.4;
const AVG_VIEWS_CAP = 5; // same reasoning, capped around 100K avg views

const calculateQualityScore = async (creator) => {
  // engagement component (capped)
  const engagementRate = Math.min(creator.instagram?.engagementRate || 0, ENGAGEMENT_CAP);
  const engagementScore = engagementRate * ENGAGEMENT_WEIGHT;

  // profile completeness component — a simple, honest checklist
  const isComplete = !!(
    creator.profilePhoto &&
    creator.bio &&
    creator.categories?.length > 0 &&
    creator.location?.city &&
    creator.location?.state &&
    (creator.pricing?.reel > 0 || creator.pricing?.post > 0)
  );
  const completenessScore = isComplete ? PROFILE_COMPLETE_POINTS : 0;

  // rating component — averaged from the separate Review collection
  const reviews = await Review.find({ creatorId: creator._id }).select('rating');
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;
  const ratingScore = avgRating * RATING_WEIGHT;

  // ── TEMPORARY components — see note at top of file ──────────────────
  const followersCount = creator.instagram?.followersCount || 0;
  // log10(0) is -Infinity, so guard the zero case explicitly
  const followersLog = followersCount > 0 ? Math.min(Math.log10(followersCount), FOLLOWERS_CAP) : 0;
  const followersScore = followersLog * FOLLOWERS_WEIGHT;

  const avgViews = creator.instagram?.avgViews || 0;
  const avgViewsLog = avgViews > 0 ? Math.min(Math.log10(avgViews), AVG_VIEWS_CAP) : 0;
  const avgViewsScore = avgViewsLog * AVG_VIEWS_WEIGHT;
  // ──────────────────────────────────────────────────────────────────

  const total = engagementScore + completenessScore + ratingScore + followersScore + avgViewsScore;

  // round to 2 decimal places — no need for excessive precision, and
  // keeps stored values clean/readable when inspecting the database
  return Math.round(total * 100) / 100;
};

module.exports = calculateQualityScore;
