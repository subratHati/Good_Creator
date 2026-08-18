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
// weighted contribution from their stored rotationValue). rotationValue
// is a plain random number refreshed once daily by a scheduled job (see
// routes/cron.js), NOT recalculated per-request — this keeps sort order
// completely stable for pagination within a day, while still rotating
// who ranks where across different days. The contribution is small
// enough that it can meaningfully reshuffle relative order within a
// bracket, but mathematically cannot push a creator's effective score
// across a bracket boundary, since bracket is always the primary sort
// key, evaluated before the rotated-score tiebreak.

const QUALITY_TIER = {
  BEST_MIN: 4,
  GOOD_MIN: 2.5,
  // anything > 0 and < GOOD_MIN is "Average"; exactly 0 is "Below Average"
};

// rotationValue is stored as a plain 0-1 random number (see Creator.js
// and routes/cron.js). This weight scales its contribution to the final
// sort score — kept small (max contribution of 0.2) so it can never push
// a creator's effective score across a real bracket boundary, same
// safety property the earlier jitter design had.
const ROTATION_WEIGHT = 0.2;

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

    // ── rotation, using a STORED field instead of live computation ──────
    // Earlier versions tried to compute rotation live, per-request, using
    // either $rand (genuinely random every call — caused Load More
    // duplicates, since sort order could shift between page 1 and page 2)
    // or a seeded hash via $function (blocked outright on this Atlas
    // tier). Both approaches added real complexity for a problem that
    // has a much simpler solution: rotationValue is a plain number
    // stored directly on each Creator document, refreshed once daily by
    // a scheduled job (see routes/cron.js), not computed here at all.
    // Reading a stored field is trivial for MongoDB — no hashing, no
    // $function, no per-request randomness, and critically: completely
    // stable within a day, so Load More pagination can never duplicate
    // or skip a creator, since the value driving the sort doesn't change
    // between page 1 and page 2 requests made on the same day.
    {
      $addFields: {
        _sortScore: {
          $add: ['$qualityScore', { $multiply: [{ $ifNull: ['$rotationValue', 0] }, ROTATION_WEIGHT] }],
        },
      },
    },

    // ── final ordering: bracket first (hard boundary), then rotated score,
    // then _id as a final tiebreaker ────────────────────────────────────
    // _sortScore ties are still possible even with rotation blended in
    // (two creators could theoretically land on the same combined value),
    // so _id stays as the last-resort tiebreaker, guaranteeing a fully
    // deterministic, duplicate-free order regardless.
    // Without a tiebreaker, MongoDB doesn't guarantee a consistent order
    // among tied documents across separate query executions, even with
    // the same seed — which was the remaining cause of duplicate/skipped
    // creators across Load More pages. _id is unique per document, so
    // adding it as the last sort key makes the full ordering fully
    // deterministic, closing that gap completely.
    { $sort: { _bracket: 1, _sortScore: -1, _id: 1 } },

    { $skip: skip },
    { $limit: limit },

    // strip internal-only fields before returning to the client — these
    // are implementation details, not something the frontend needs.
    // Note: rotationValue itself is intentionally NOT excluded — it's a
    // real, harmless field the frontend can ignore, no need to strip it.
    {
      $project: {
        'instagram.accessToken': 0,
        _categoryMatch: 0,
        _locationMatch: 0,
        _matchCount: 0,
        _tier: 0,
        _bracket: 0,
        _sortScore: 0,
      },
    },
  ];
};

module.exports = buildCreatorRankingPipeline;
