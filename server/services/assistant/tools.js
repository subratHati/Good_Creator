const mongoose = require('mongoose');
const Creator = require('../../models/Creator');
const Opening = require('../../models/Opening');
const buildCreatorRankingPipeline = require('../../utils/buildCreatorRankingPipeline');
const { CREATOR_TOOLS, runCreatorTool } = require('./creatorTools');

const CREATOR_CATEGORIES = ['lifestyle', 'food', 'travel', 'fashion', 'beauty', 'tech', 'fitness', 'gaming', 'education', 'finance', 'entertainment', 'parenting_family', 'vlogging', 'dance', 'religious', 'news_politics', 'video_editing', 'ai_content', 'pets_wildlife', 'other'];
const GENDERS = ['male', 'female', 'other'];
const SORT_OPTIONS = ['recommended', 'avg_views', 'followers', 'engagement', 'avg_reach', 'price_low'];
const MAX_CARDS = 5;
const MIN_FOLLOWERS_FOR_ENGAGEMENT = 100; // tiny accounts are too noisy to rank by engagement

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const text = (v, max = 60) => String(v || '').trim().slice(0, max);

// a finite number clamped to [min, max], or null if the value isn't usable
const num = (v, min, max) => {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, n));
};

const addRange = (query, path, min, max) => {
  if (min === null && max === null) return;
  query[path] = {};
  if (min !== null) query[path].$gte = min;
  if (max !== null) query[path].$lte = max;
};

const SEARCH_CREATORS_TOOL = {
  name: 'search_creators',
  description:
    "Search GoodCreator's real creators for the brand. Returns how many matched; the matching creators are shown to the user as cards automatically, so never list them yourself. Use whenever the brand wants creator suggestions. Only set filters the brand asked for, or that clearly follow from a campaign they referred to. All counts are plain numbers: 1M = 1000000, 50k = 50000. Prices are in rupees. This tool CAN filter by gender, language, followers, average views, reach, likes, comments, engagement rate, prices, barter and verified status.",
  input_schema: {
    type: 'object',
    properties: {
      category: { type: 'string', enum: CREATOR_CATEGORIES, description: "Creator's content category" },
      city: { type: 'string', description: 'City the creator is based in, e.g. Bhubaneswar. One city per search.' },
      state: { type: 'string', description: 'State the creator is based in, e.g. Odisha' },
      gender: { type: 'string', enum: GENDERS, description: 'Creator gender. Only creators who set their gender are included.' },
      language: { type: 'string', description: 'A language the creator speaks, e.g. Hindi' },
      min_followers: { type: 'integer', minimum: 0 },
      max_followers: { type: 'integer', minimum: 0 },
      min_avg_views: { type: 'integer', minimum: 0, description: 'Minimum average Reel views' },
      max_avg_views: { type: 'integer', minimum: 0 },
      min_avg_reach: { type: 'integer', minimum: 0, description: 'Minimum average reach' },
      min_avg_likes: { type: 'integer', minimum: 0 },
      min_avg_comments: { type: 'integer', minimum: 0 },
      min_engagement_rate: { type: 'number', description: 'Minimum engagement rate in percent, 0 to 100 (interactions divided by reach). Cannot be above 100.' },
      max_reel_price: { type: 'integer', description: 'Maximum price for one Reel. Only creators with a listed Reel price at or below this are included.' },
      max_post_price: { type: 'integer', description: 'Maximum price for one post' },
      max_story_price: { type: 'integer', description: 'Maximum price for one story' },
      barter_only: { type: 'boolean', description: 'Only creators open to barter (free product) collaborations' },
      verified_only: { type: 'boolean', description: 'Only creators verified by GoodCreator' },
      sort_by: {
        type: 'string',
        enum: SORT_OPTIONS,
        description: "'avg_views' = most Reel views first, 'followers' = biggest audience first, 'engagement' = best engagement first, 'avg_reach' = widest reach first, 'price_low' = cheapest Reel first. Default 'recommended'.",
      },
      limit: { type: 'integer', minimum: 1, maximum: MAX_CARDS, description: `How many creators to return. If the user says 'give me 3', use 3. Default 4, maximum ${MAX_CARDS}.` },
      more_results: {
        type: 'boolean',
        description: "Set true ONLY when the user asks for more / other / different / next creators for the same search, so creators already shown in this chat are skipped. Leave unset for a new or changed search.",
      },
    },
  },
};

const GET_MY_CAMPAIGNS_TOOL = {
  name: 'get_my_campaigns',
  description:
    "Get the brand's own active campaigns: title, wanted creator categories and cities, minimum followers and budget. Use when the brand says 'my campaign' or does not say what they need.",
  input_schema: { type: 'object', properties: {} },
};

const toolsForRole = (role) =>
  role === 'brand' ? [SEARCH_CREATORS_TOOL, GET_MY_CAMPAIGNS_TOOL] : role === 'creator' ? CREATOR_TOOLS : [];

// Only these fields ever leave the server — never bank details, tokens, email or phone.
const toCard = (c) => ({
  creatorId: String(c._id),
  name: c.name || 'Creator',
  profilePhoto: c.profilePhoto || '',
  handle: c.instagram?.handle || '',
  city: c.location?.city || '',
  followers: c.instagram?.followersCount || 0,
  avgViews: c.instagram?.avgViews || 0,
  engagementRate: Math.min(c.instagram?.engagementRate || 0, 100),
  reelPrice: c.pricing?.reel || 0,
  barter: !!c.barterEnabled,
});

const SAFE_SELECT =
  'name profilePhoto location pricing barterEnabled instagram.handle instagram.followersCount instagram.avgViews instagram.engagementRate';

const toObjectIds = (ids) =>
  ids
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

const runSearchCreators = async (input, ctx) => {
  if (Number(input.min_engagement_rate) > 100) {
    return {
      content: JSON.stringify({ error: 'Engagement rate is a percentage and cannot be above 100%. Tell the user this and ask for a lower minimum (for example 10%).' }),
      isError: true,
    };
  }

  const query = { isOpenForCollab: true };
  const applied = {};
  const notes = [];

  const sortBy = SORT_OPTIONS.includes(input.sort_by) ? input.sort_by : 'recommended';
  const limit = Math.floor(num(input.limit, 1, MAX_CARDS) ?? 4);

  if (CREATOR_CATEGORIES.includes(input.category)) {
    query.categories = { $in: [input.category] };
    applied.category = input.category;
  }

  const city = text(input.city);
  if (city) {
    query['location.city'] = { $regex: escapeRegex(city), $options: 'i' };
    applied.city = city;
  }

  const state = text(input.state);
  if (state) {
    query['location.state'] = { $regex: escapeRegex(state), $options: 'i' };
    applied.state = state;
  }

  if (GENDERS.includes(input.gender)) {
    query.gender = input.gender;
    applied.gender = input.gender;
    notes.push('Gender searches only include creators who set their gender on their profile.');
  }

  const language = text(input.language, 30);
  if (language) {
    query.languages = { $regex: `^${escapeRegex(language)}$`, $options: 'i' };
    applied.language = language;
  }

  // creators with no Instagram data at all can't be judged on metrics, so they're left out
  query['instagram.handle'] = { $nin: ['', null] };

  let minF = num(input.min_followers, 0, 1e9);
  const maxF = num(input.max_followers, 0, 1e9);
  const minE = num(input.min_engagement_rate, 0, 100);
  if ((sortBy === 'engagement' || minE) && (minF === null || minF < MIN_FOLLOWERS_FOR_ENGAGEMENT)) {
    minF = MIN_FOLLOWERS_FOR_ENGAGEMENT;
    notes.push(`Creators with under ${MIN_FOLLOWERS_FOR_ENGAGEMENT} followers are skipped when ranking or filtering by engagement, because their numbers are too small to compare.`);
  } else if (minF !== null) {
    applied.min_followers = minF;
  }
  if (maxF !== null) applied.max_followers = maxF;
  addRange(query, 'instagram.followersCount', minF, maxF);

  if (minE) applied.min_engagement_rate = minE;
  // rates above 100% are data errors, so they never match an engagement search or ranking
  if (minE || sortBy === 'engagement') {
    query['instagram.engagementRate'] = { $gt: 0, $lte: 100, ...(minE ? { $gte: minE } : {}) };
  }

  const minViews = num(input.min_avg_views, 0, 1e10);
  const maxViews = num(input.max_avg_views, 0, 1e10);
  addRange(query, 'instagram.avgViews', minViews, maxViews);
  if (minViews !== null) applied.min_avg_views = minViews;
  if (maxViews !== null) applied.max_avg_views = maxViews;

  const minReach = num(input.min_avg_reach, 0, 1e10);
  if (minReach !== null) { query['instagram.avgReach'] = { $gte: minReach }; applied.min_avg_reach = minReach; }
  const minLikes = num(input.min_avg_likes, 0, 1e9);
  if (minLikes !== null) { query['instagram.avgLikes'] = { $gte: minLikes }; applied.min_avg_likes = minLikes; }
  const minComments = num(input.min_avg_comments, 0, 1e9);
  if (minComments !== null) { query['instagram.avgComments'] = { $gte: minComments }; applied.min_avg_comments = minComments; }

  for (const [key, path] of [['max_reel_price', 'pricing.reel'], ['max_post_price', 'pricing.post'], ['max_story_price', 'pricing.story']]) {
    const v = num(input[key], 1, 1e7);
    if (v !== null) { query[path] = { $gt: 0, $lte: v }; applied[key] = v; }
  }
  if (applied.max_reel_price || applied.max_post_price || applied.max_story_price) {
    notes.push('Price filters only include creators who listed that price.');
  }

  if (input.barter_only === true) { query.barterEnabled = true; applied.barter_only = true; }
  if (input.verified_only === true) { query.isAdminVerified = true; applied.verified_only = true; }

  if (sortBy === 'price_low' && !query['pricing.reel']) query['pricing.reel'] = { $gt: 0 };

  // skip creators already shown: always within this turn, and across the chat when the user asked for "more"
  const moreResults = input.more_results === true;
  const excludeIds = new Set(ctx.turnIds);
  if (moreResults) ctx.shownIds.forEach((id) => excludeIds.add(id));
  const exclude = toObjectIds([...excludeIds]);
  const finalQuery = exclude.length ? { ...query, _id: { $nin: exclude } } : query;

  const fetchCreators = async () => {
    if (sortBy === 'recommended') {
      const brand = ctx.brand;
      return Creator.aggregate(
        buildCreatorRankingPipeline({
          matchQuery: finalQuery,
          brandCategory: brand?.category || null,
          brandCity: brand?.location?.city || null,
          brandState: brand?.location?.state || null,
          skip: 0,
          limit,
        })
      );
    }
    const sortMap = {
      avg_views: { 'instagram.avgViews': -1, _id: 1 },
      followers: { 'instagram.followersCount': -1, _id: 1 },
      engagement: { 'instagram.engagementRate': -1, _id: 1 },
      avg_reach: { 'instagram.avgReach': -1, _id: 1 },
      price_low: { 'pricing.reel': 1, _id: 1 },
    };
    return Creator.find(finalQuery).select(SAFE_SELECT).sort(sortMap[sortBy]).limit(limit).lean();
  };

  const [creators, remaining, totalAll] = await Promise.all([
    fetchCreators(),
    Creator.countDocuments(finalQuery),
    exclude.length ? Creator.countDocuments(query) : Promise.resolve(null),
  ]);
  const cards = creators.map(toCard);
  cards.forEach((c) => ctx.turnIds.add(c.creatorId));

  if (cards.length === 0) {
    notes.push(moreResults ? 'No more creators match these filters.' : 'No creators matched these filters.');
  }

  return {
    content: JSON.stringify({
      found: cards.length,
      total_matching: totalAll ?? remaining,
      ...(totalAll !== null ? { not_yet_shown: remaining } : {}),
      sorted_by: sortBy,
      filters_applied: applied,
      ...(notes.length ? { notes } : {}),
    }),
    cards,
  };
};

const runGetMyCampaigns = async (ctx) => {
  if (!ctx.brand) {
    return { content: JSON.stringify({ campaigns: [], note: 'This brand has no profile yet.' }) };
  }
  const openings = await Opening.find({ brandId: ctx.brand._id, status: 'active' })
    .select('title requirements budgetMin budgetMax isBarter deliverables')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();
  const campaigns = openings.map((o) => ({
    title: o.title,
    wanted_categories: o.requirements?.categories || [],
    wanted_cities: o.requirements?.locations || [],
    min_followers: o.requirements?.minFollowers || 0,
    min_engagement_rate: o.requirements?.minEngagement || 0,
    budget_min: o.budgetMin || 0,
    budget_max: o.budgetMax || 0,
    barter: !!o.isBarter,
    deliverables: o.deliverables,
  }));
  return { content: JSON.stringify({ campaigns }) };
};

// ctx = { role, userId, brand, shownIds:Set, turnIds:Set }. Tools are role-gated on the server too.
const runTool = async (name, input, ctx) => {
  if (name === 'search_creators' && ctx.role === 'brand') return runSearchCreators(input || {}, ctx);
  if (name === 'get_my_campaigns' && ctx.role === 'brand') return runGetMyCampaigns(ctx);
  const creatorResult = await runCreatorTool(name, input || {}, ctx);
  if (creatorResult) return creatorResult;
  return { content: JSON.stringify({ error: 'Unknown tool' }), isError: true };
};

module.exports = { toolsForRole, runTool, MAX_CARDS };