// utils/buildCreatorRankingPipeline.js
//
// Builds the MongoDB aggregation pipeline that implements GoodCreator's
// tiered creator ranking system for browse/search results.
//
// ── THE RANKING MODEL ──────────────────────────────────────────────────
// Each creator has a stored qualityScore (engagement + profile
// completeness + rating, plus TEMPORARY followers/avgViews — see
// calculateQualityScore.js). That score places them in a quality tier:
//   Best          : qualityScore >= 4
//   Good          : 2.5 <= qualityScore < 4
//   Average       : 0 <  qualityScore < 2.5
//   Below Average : qualityScore == 0
//
// Separately, for THIS specific search, we check whether the creator's
// category/location matches the searching brand's own category/location
// (0, 1, or 2 matches).
//
// Combining tier + match count places every creator into one of 3
// brackets (Top / Mid / Bottom):
//
//                    no match      one match      both match
//   Best             Top           Top            Top
//   Good              Mid          Top            Top
//   Average          Bottom        Mid            Top
//   Below Average    Bottom        Bottom         Bottom
//
// A creator's bracket is a HARD boundary — rotation (below) only ever
// reorders creators WITHIN a bracket, never moves anyone across one.
// This guarantees a genuinely low-quality, non-matching creator can
// never outrank a strong one, while still giving mid-tier creators with
// good relevance a real shot at the top section, and preventing any
// single top creator from permanently monopolizing position #1.
//
// ── ROTATION ────────────────────────────────────────────────────────────
// Within a bracket, creators are sorted by (qualityScore + a small
// random jitter), recalculated fresh on every request. The jitter is
// small enough that it can meaningfully reshuffle relative order within
// a bracket, but mathematically cannot push a creator's effective score
// across a bracket boundary, since bracket is always the primary sort
// key, evaluated before the jittered qualityScore tiebreak.

const QUALITY_TIER = {
  BEST_MIN: 4,
  GOOD_MIN: 2.5,
  // anything > 0 and < GOOD_MIN is "Average"; exactly 0 is "Below Average"
};

const JITTER_RANGE = 0.4; // +/- 0.2, small enough to never cross a real bracket gap

const buildCreatorRankingPipeline = ({ matchQuery, brandCategory, brandCity, brandState, skip, limit }) => {
  return [
    { $match: matchQuery },

    // ── match signals for THIS brand's search ──────────────────────────
    {
      $addFields: {
        _categoryMatch: brandCategory
          ? { $cond: [{ $in: [brandCategory, { $ifNull: ['$categories', []] }] }, 1, 0] }
          : 0,
        _locationMatch: (brandCity || brandState)
          ? {
              $cond: [
                {
                  $or: [
                    brandCity ? { $eq: ['$location.city', brandCity] } : false,
                    brandState ? { $eq: ['$location.state', brandState] } : false,
                  ],
                },
                1,
                0,
              ],
            }
          : 0,
      },
    },

    { $addFields: { _matchCount: { $add: ['$_categoryMatch', '$_locationMatch'] } } },

    // ── quality tier, expressed as a number for easy comparison ────────
    // 3 = Best, 2 = Good, 1 = Average, 0 = Below Average
    {
      $addFields: {
        _tier: {
          $switch: {
            branches: [
              { case: { $gte: ['$qualityScore', QUALITY_TIER.BEST_MIN] }, then: 3 },
              { case: { $gte: ['$qualityScore', QUALITY_TIER.GOOD_MIN] }, then: 2 },
              { case: { $gt: ['$qualityScore', 0] }, then: 1 },
            ],
            default: 0,
          },
        },
      },
    },

    // ── bracket assignment from the table above ─────────────────────────
    // 0 = Top, 1 = Mid, 2 = Bottom (lower number sorts first)
    {
      $addFields: {
        _bracket: {
          $switch: {
            branches: [
              // Best: always Top
              { case: { $eq: ['$_tier', 3] }, then: 0 },
              // Good: Top with any match, Mid with none
              { case: { $and: [{ $eq: ['$_tier', 2] }, { $gte: ['$_matchCount', 1] }] }, then: 0 },
              { case: { $eq: ['$_tier', 2] }, then: 1 },
              // Average: Top with both matches, Mid with one, Bottom with none
              { case: { $and: [{ $eq: ['$_tier', 1] }, { $eq: ['$_matchCount', 2] }] }, then: 0 },
              { case: { $and: [{ $eq: ['$_tier', 1] }, { $eq: ['$_matchCount', 1] }] }, then: 1 },
              { case: { $eq: ['$_tier', 1] }, then: 2 },
            ],
            // Below Average: always Bottom, regardless of match
            default: 2,
          },
        },
      },
    },

    // ── rotation jitter, recalculated fresh every request ───────────────
    {
      $addFields: {
        _jitter: { $subtract: [{ $multiply: [{ $rand: {} }, JITTER_RANGE] }, JITTER_RANGE / 2] },
      },
    },
    { $addFields: { _sortScore: { $add: ['$qualityScore', '$_jitter'] } } },

    // ── final ordering: bracket first (hard boundary), then jittered score ──
    { $sort: { _bracket: 1, _sortScore: -1 } },

    { $skip: skip },
    { $limit: limit },

    // strip internal-only fields before returning to the client — these
    // are implementation details, not something the frontend needs
    {
      $project: {
        'instagram.accessToken': 0,
        _categoryMatch: 0,
        _locationMatch: 0,
        _matchCount: 0,
        _tier: 0,
        _bracket: 0,
        _jitter: 0,
        _sortScore: 0,
      },
    },
  ];
};

module.exports = buildCreatorRankingPipeline;
