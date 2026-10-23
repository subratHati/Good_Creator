const Opening = require('../../models/Opening');
const Brand = require('../../models/Brand');
const Application = require('../../models/Application');

const MAX_CARDS = 5; // keep equal to MAX_CARDS in tools.js
const CANDIDATES = 200; // campaigns are few, so they are filtered and ranked in code
const CATEGORIES = ['lifestyle', 'food', 'travel', 'fashion', 'beauty', 'tech', 'fitness', 'gaming', 'education', 'finance', 'entertainment', 'parenting_family', 'vlogging', 'dance', 'religious', 'news_politics', 'video_editing', 'ai_content', 'pets_wildlife', 'other'];
const SORTS = ['best_match', 'highest_budget', 'deadline_soon', 'newest'];
const DELIVERABLES = ['reels', 'posts', 'stories', 'ugc'];
const BLOCKED = /(?!)/; // blocking turned off for now // campaigns the AI will not suggest; set to /(?!)/ to turn off
const KNOWN_CITIES = ['mumbai', 'delhi', 'bangalore', 'bengaluru', 'hyderabad', 'chennai', 'kolkata', 'pune', 'ahmedabad', 'jaipur', 'lucknow', 'surat', 'kochi', 'chandigarh', 'indore', 'bhopal', 'nagpur', 'patna', 'guwahati', 'ranchi', 'raipur', 'bhubaneswar', 'cuttack', 'noida', 'gurgaon', 'gurugram', 'goa'];

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const text = (v, max = 60) => String(v || '').trim().slice(0, max);
const num = (v, min, max) => {
    if (v === undefined || v === null || v === '') return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    return Math.min(max, Math.max(min, n));
};
const count = (v) => (typeof v === 'number' ? v : v ? 1 : 0);
const short = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K` : String(n));
const time = (d) => { const t = d ? new Date(d).getTime() : NaN; return Number.isFinite(t) ? t : null; };

const SEARCH_CAMPAIGNS_TOOL = {
    name: 'search_campaigns',
    description:
        "Search the active brand campaigns on GoodCreator for the creator. Returns counts; the matching campaigns are shown to the user as cards automatically, so never list them yourself. Results are shown newest first by default. Campaigns the creator already applied to are hidden. Only set filters the creator asked for. Prices are in rupees.",
    input_schema: {
        type: 'object',
        properties: {
            category: { type: 'string', enum: CATEGORIES, description: 'Campaigns looking for this creator category' },
            city: { type: 'string', description: 'Campaigns from brands based in this city (or mentioning it), then brands elsewhere in the same state, nearest first. Campaigns have no location setting. Leave out for anywhere in India.' },
            keyword: { type: 'string', description: 'Search words in the campaign title, description or brand name' },
            min_budget: { type: 'integer', minimum: 0, description: 'Minimum campaign budget in rupees' },
            payment_type: { type: 'string', enum: ['paid', 'barter'], description: "'paid' = only campaigns that pay money (not barter); 'barter' = only barter (free product) campaigns. Leave unset for both." },
            barter_only: { type: 'boolean', description: 'Same as payment_type=barter' },
            deliverable: { type: 'string', enum: DELIVERABLES, description: 'Campaigns that include this deliverable' },
            only_matching: { type: 'boolean', description: 'Only campaigns the creator already qualifies for' },
            posted_within_hours: { type: 'integer', minimum: 1, maximum: 720, description: 'Only campaigns posted (created) in the last N hours, e.g. 24 for "posted today / in the last 24 hours". This is about when the campaign was posted, not its deadline.' },
            closing_within_days: { type: 'integer', minimum: 1, maximum: 365, description: 'Only campaigns whose apply-by deadline is within the next N days. Campaigns with no deadline are left out.' },
            sort_by: { type: 'string', enum: SORTS, description: "Default 'newest' (recently posted first); leave unset unless the creator asks for a different order. Use 'best_match' only when they ask for the best fit / most suitable campaigns for them, 'highest_budget' for the highest paying, 'deadline_soon' for closing first." },
            limit: { type: 'integer', minimum: 1, maximum: MAX_CARDS, description: `How many campaigns to return. Default 4, maximum ${MAX_CARDS}.` },
            more_results: { type: 'boolean', description: 'Set true ONLY when the user asks for more / other / next campaigns of the same search, so campaigns already shown in this chat are skipped.' },
        },
    },
};

const GET_MY_APPLICATIONS_TOOL = {
    name: 'get_my_applications',
    description: "Get the creator's own campaign applications: how many per status and their most recent ones. Use when they ask about their applications or whether a brand replied.",
    input_schema: { type: 'object', properties: {} },
};

const CREATOR_TOOLS = [SEARCH_CAMPAIGNS_TOOL, GET_MY_APPLICATIONS_TOOL];

const runSearchCampaigns = async (input, ctx) => {
    const creator = ctx.creator;
    if (!creator) {
        return {
            content: JSON.stringify({ error: 'This creator has not completed their profile yet. Ask them to complete it first.' }),
            isError: true,
        };
    }

    if (BLOCKED.test(`${input.keyword || ''} ${input.category || ''}`)) {
        return {
            content: JSON.stringify({
                found: 0,
                notes: ['GoodCreator Assistant does not suggest gambling, betting or casino campaigns. Tell the creator this plainly in one sentence. Do not suggest other keywords to find them.'],
            }),
            cards: [],
        };
    }

    const sortBy = SORTS.includes(input.sort_by) ? input.sort_by : 'newest';
    const limit = Math.floor(num(input.limit, 1, MAX_CARDS) ?? 4);
    const query = { status: 'active' };
    const and = [];
    const applied = {};
    const notes = [];

    if (CATEGORIES.includes(input.category)) {
        query['requirements.categories'] = { $in: [input.category] };
        applied.category = input.category;
    }

    // Campaigns have no location setting, so "place" comes from the brand's own city/state
    // (or the city being named in the campaign text). Nearest first: this city, then same state.
    const city = text(input.city);
    let cityBrandIds = [];
    let nearbyBrandIds = new Set();
    let stateName = '';
    if (city) {
        const cityBrands = await Brand.find({ 'location.city': { $regex: escapeRegex(city), $options: 'i' } })
            .select('_id location.state')
            .limit(500)
            .lean();
        cityBrandIds = cityBrands.map((b) => String(b._id));
        const tally = {};
        cityBrands.forEach((b) => {
            const s = String(b.location?.state || '').trim();
            if (s) tally[s] = (tally[s] || 0) + 1;
        });
        stateName = Object.keys(tally).sort((a, b) => tally[b] - tally[a])[0] || '';
        if (stateName) {
            const sameState = await Brand.find({ 'location.state': { $regex: `^${escapeRegex(stateName)}$`, $options: 'i' } })
                .select('_id')
                .limit(2000)
                .lean();
            nearbyBrandIds = new Set(sameState.map((b) => String(b._id)));
        }
        if (!cityBrandIds.length) {
            // the creator may have named a state ("Odisha") instead of a city
            const byState = await Brand.find({ 'location.state': { $regex: `^${escapeRegex(city)}$`, $options: 'i' } })
                .select('_id')
                .limit(2000)
                .lean();
            if (byState.length) {
                cityBrandIds = byState.map((b) => String(b._id));
                stateName = city;
                nearbyBrandIds = new Set(cityBrandIds);
            }
        }
        applied.city = city;
        if (stateName) applied.then_nearby_in = stateName;
    }
    const cityBrandSet = new Set(cityBrandIds);
    const cityTest = city ? new RegExp(escapeRegex(city), 'i') : null;
    // 0 = this city, 1 = same state, 2 = elsewhere
    const placeStage = (o) => {
        if (!city) return 0;
        const bid = String(o.brandId?._id || '');
        const campaignText = `${o.title || ''} ${o.description || ''} ${(o.requirements?.locations || []).join(' ')}`;
        if (cityBrandSet.has(bid) || cityTest.test(campaignText)) return 0;
        if (nearbyBrandIds.has(bid)) return 1;
        return 2;
    };

    const minBudget = num(input.min_budget, 0, 1e8);
    if (minBudget) { query.budgetMax = { $gte: minBudget }; applied.min_budget = minBudget; }
    if (input.payment_type === 'paid') { query.isBarter = { $ne: true }; applied.payment_type = 'paid'; }
    else if (input.payment_type === 'barter' || input.barter_only === true) { query.isBarter = true; applied.payment_type = 'barter'; }
    if (DELIVERABLES.includes(input.deliverable)) {
        query[`deliverables.${input.deliverable}`] = { $gt: 0 };
        applied.deliverable = input.deliverable;
    }

    const keyword = text(input.keyword, 40);
    if (keyword) {
        const rx = { $regex: escapeRegex(keyword), $options: 'i' };
        const brands = await Brand.find({ brandName: rx }).select('_id').limit(50).lean();
        and.push({ $or: [{ title: rx }, { description: rx }, { 'requirements.categories': rx }, { brandId: { $in: brands.map((b) => b._id) } }] });
        applied.keyword = keyword;
    }
    if (and.length) query.$and = and;

    const postedHours = num(input.posted_within_hours, 1, 720);
    if (postedHours) {
        query.createdAt = { $gte: new Date(Date.now() - postedHours * 3600 * 1000) };
        applied.posted_within_hours = Math.floor(postedHours);
    }
    const closingDays = num(input.closing_within_days, 1, 365);
    if (closingDays) {
        query.deadline = { $gte: new Date(), $lte: new Date(Date.now() + closingDays * 86400000) };
        applied.closing_within_days = Math.floor(closingDays);
    }

    const onlyMatching = input.only_matching === true;
    if (onlyMatching) applied.only_matching = true;
    const moreResults = input.more_results === true;

    const appliedDocs = await Application.find({ creatorId: creator._id }).select('openingId').lean();
    const hide = new Set([...appliedDocs.map((a) => String(a.openingId)), ...ctx.turnIds]);
    if (appliedDocs.length) notes.push('Campaigns the creator already applied to are hidden.');

    const docs = await Opening.find(query)
        .populate('brandId', 'brandName logo category location')
        .sort({ createdAt: -1 })
        .limit(CANDIDATES)
        .lean();
    if (docs.length === CANDIDATES) notes.push(`Only the newest ${CANDIDATES} campaigns were considered.`);


    // how well does this creator's own profile meet each campaign's requirements?
    const creatorCats = new Set((creator.categories || []).map((c) => String(c).toLowerCase()));
    const creatorCity = String(creator.location?.city || '').trim().toLowerCase();
    const followers = creator.instagram?.followersCount || 0;
    const engagement = Math.min(creator.instagram?.engagementRate || 0, 100);

    const evaluate = (o) => {
        const r = o.requirements || {};
        const unmet = [];
        if (r.minFollowers && followers < r.minFollowers) unmet.push(`Needs ${short(r.minFollowers)} followers`);
        const wanted = (r.categories || []).map((c) => String(c).toLowerCase());
        const overlap = wanted.filter((c) => creatorCats.has(c)).length;
        if (wanted.length && !overlap) unmet.push('Different category');
        const locs = (r.locations || []).map((l) => String(l).trim().toLowerCase()).filter(Boolean);
        const cityOk = !locs.length || (creatorCity && locs.some((l) => l === creatorCity || creatorCity.includes(l) || l.includes(creatorCity)));
        if (!cityOk) unmet.push('Different location');
        const homeCity = (city || creatorCity || '').toLowerCase();
        if (!locs.length && homeCity) {
            const title = String(o.title || '').toLowerCase();
            const named = KNOWN_CITIES.find((c) => new RegExp(`\\b${c}\\b`).test(title));
            if (named && named !== homeCity && !homeCity.includes(named)) {
                unmet.push(`Title mentions ${named[0].toUpperCase()}${named.slice(1)}`);
            }
        }
        if (r.minEngagement && engagement < r.minEngagement) unmet.push(`Needs ${r.minEngagement}% engagement`);
        const matches = unmet.length === 0;
        const keywordInTitle = keyword && String(o.title || '').toLowerCase().includes(keyword.toLowerCase());
        return { matches, unmet, score: (matches ? 100 : 0) + overlap * 10 + (locs.length && cityOk ? 5 : 0) + (keywordInTitle ? 15 : 0) - unmet.length };
    };

    const now = Date.now();
    let pool = docs
        .filter((o) => { const t = time(o.deadline); return !(t !== null && t < now); }) // expired
        .filter((o) => !hide.has(String(o._id)))
        .filter((o) => !BLOCKED.test(`${o.title || ''} ${o.description || ''}`))
        .map((o) => ({ o, ev: evaluate(o), stage: placeStage(o) }))
        .filter((x) => !city || x.stage <= 1); // with a city: only that city and the rest of its state
    if (onlyMatching) pool = pool.filter((x) => x.ev.matches);
    const totalMatching = pool.length;
    if (city) {
        const inCity = pool.filter((x) => x.stage === 0).length;
        notes.push(`By place: ${inCity} in ${city}, ${pool.length - inCity} elsewhere in ${stateName || 'the same state'}. Results are ordered nearest first: ${city}, then ${stateName || 'the same state'}.`);
    }
    if (moreResults) pool = pool.filter((x) => !ctx.shownIds.has(String(x.o._id)));

    const created = (x) => time(x.o.createdAt) || 0;
    const sorters = {
        best_match: (a, b) => b.ev.score - a.ev.score || created(b) - created(a),
        highest_budget: (a, b) => (b.o.isBarter ? 0 : b.o.budgetMax || 0) - (a.o.isBarter ? 0 : a.o.budgetMax || 0) || created(b) - created(a),
        deadline_soon: (a, b) => (time(a.o.deadline) ?? Infinity) - (time(b.o.deadline) ?? Infinity) || created(b) - created(a),
        newest: (a, b) => created(b) - created(a),
    };
    pool.sort(sorters[sortBy]);
    if (city) pool.sort((a, b) => a.stage - b.stage); // nearest first (the sort is stable)

    const picked = pool.slice(0, limit);
    const shownInCity = picked.filter((x) => x.stage === 0).length;
    const cards = picked.map(({ o, ev }) => ({
        type: 'campaign',
        openingId: String(o._id),
        title: o.title || 'Campaign',
        brandName: o.brandId?.brandName || 'Brand',
        brandLogo: o.brandId?.logo || '',
        place: [o.brandId?.location?.city, o.brandId?.location?.state].filter(Boolean).join(', '),
        budgetMin: o.budgetMin || 0,
        budgetMax: o.budgetMax || 0,
        barter: !!o.isBarter,
        deliverables: {
            reels: count(o.deliverables?.reels),
            posts: count(o.deliverables?.posts),
            stories: count(o.deliverables?.stories),
            ugc: count(o.deliverables?.ugc),
        },
        deadline: o.deadline || null,
        postedAt: o.createdAt || null,
        matches: ev.matches,
        unmet: ev.unmet.slice(0, 2),
    }));
    cards.forEach((c) => ctx.turnIds.add(c.openingId));

    if (cards.length === 0) {
        if (city) {
            notes.push(`There are no ${moreResults ? 'more ' : ''}campaigns from ${city}${stateName ? ` or elsewhere in ${stateName}` : ''} for these filters. Do NOT search again yet. Ask the creator which they prefer: (1) campaigns from anywhere in India with the same filters (search without city, more_results=true), or (2) campaigns from ${city} and nearby with other categories (search with city but without the category filter, more_results=true; only offer this if a category filter was used).`);
        } else {
            notes.push(moreResults ? 'No more campaigns match these filters.' : 'No campaigns matched these filters.');
        }
    }

    return {
        content: JSON.stringify({
            found: cards.length,
            total_matching: totalMatching,
            ...(moreResults ? { not_yet_shown: pool.length } : {}),
            ...(city ? { shown_from_city: shownInCity, shown_from_rest_of_state: cards.length - shownInCity } : {}),
            sorted_by: sortBy,
            filters_applied: applied,
            cards_the_creator_matches: cards.filter((c) => c.matches).length,
            ...(notes.length ? { notes } : {}),
        }),
        cards,
    };
};

const runGetMyApplications = async (ctx) => {
    if (!ctx.creator) {
        return { content: JSON.stringify({ applications: [], note: 'This creator has no profile yet.' }) };
    }
    const [total, apps] = await Promise.all([
        Application.countDocuments({ creatorId: ctx.creator._id }),
        Application.find({ creatorId: ctx.creator._id })
            .sort({ createdAt: -1 })
            .limit(30)
            .populate('openingId', 'title')
            .populate('brandId', 'brandName')
            .lean(),
    ]);
    const byStatus = {};
    apps.forEach((a) => { byStatus[a.status] = (byStatus[a.status] || 0) + 1; });
    return {
        content: JSON.stringify({
            total_applications: total,
            by_status_among_latest_30: byStatus,
            recent: apps.slice(0, 5).map((a) => ({
                campaign: a.openingId?.title || 'Campaign',
                brand: a.brandId?.brandName || 'Brand',
                status: a.status,
                applied_on: a.createdAt ? new Date(a.createdAt).toISOString().slice(0, 10) : '',
            })),
        }),
    };
};

// returns null when the tool isn't a creator tool, so tools.js can carry on
const runCreatorTool = async (name, input, ctx) => {
    if (ctx.role !== 'creator') return null;
    if (name === 'search_campaigns') return runSearchCampaigns(input || {}, ctx);
    if (name === 'get_my_applications') return runGetMyApplications(ctx);
    return null;
};

module.exports = { CREATOR_TOOLS, runCreatorTool };