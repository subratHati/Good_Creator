const { generateReply } = require('./llm');
const { toolsForRole, runTool, MAX_CARDS } = require('./tools');
const Brand = require('../../models/Brand');
const Creator = require('../../models/Creator');
const AssistantMessage = require('../../models/AssistantMessage');

const MAX_TOOL_ROUNDS = 4; // safety cap so the AI can't loop forever

const BRAND_SEARCH_RULES = `
CREATOR SEARCH RULES (for brands):
- Use search_creators for every request for creator suggestions. The creators appear as cards automatically; never list their names or numbers yourself.
- Set only the filters the brand actually asked for (or that follow from a campaign they referred to). Never invent a budget, price limit, follower minimum, city or category. If a needed detail is missing, either search without it or ask one short question.
- The search supports: category, city, state, gender, language, followers, average views, reach, likes, comments, engagement rate, Reel/post/story price, barter, verified creators, and sorting. Never say you cannot filter by one of these. If an earlier message in this chat said you could not filter by something on this list, that message was wrong: just run the search. Gender only includes creators who set it on their profile; say so if relevant.
- The search already leaves out creators who have no Instagram data, so never say it cannot do that.
- "1M" means 1000000, "50k" means 50000. If the brand asks for N creators, use limit N, but never more than ${MAX_CARDS}. If they ask for more than ${MAX_CARDS} (for example 10 or 12), search with limit ${MAX_CARDS}, say you show ${MAX_CARDS} at a time, and offer to show more when they ask.
- For several cities, run one search per city (at most 3 cities) and split the ${MAX_CARDS} cards between them (for example limit 3 for one city and 2 for the other), because at most ${MAX_CARDS} cards can be shown in one reply.
- If the brand asks for more / others / next, repeat the same filters with more_results=true. For a changed request, do not set it.
- After searching, write one or two short sentences: which filters you used, and how many creators matched in total. If nothing matched, say so and suggest loosening the least important filter; if you loosen a filter yourself, say exactly which one.
- You only see counts, not creator statistics. Do not claim to know a specific creator's numbers; the cards show them.
- Engagement rate is interactions (likes, comments, saves, shares) divided by reach, so it can never be above 100%. If asked for more than 100%, explain that and ask for a lower minimum instead of searching.`;

const CREATOR_SEARCH_RULES = `
CAMPAIGN SEARCH RULES (for creators):
- You CAN search campaigns with search_campaigns and check application status with get_my_applications. If an earlier message or instruction says you cannot search campaigns yet, that is outdated: just run the search.
- Campaigns appear as cards automatically; never list titles, brands or budgets yourself.
- Set only the filters the creator actually asked for. Never invent a budget, city or category. If they just ask for campaigns for them, search with no filters: the default order is newest first. Use sort_by='best_match' only when they ask for the best fit or the most suitable campaigns for them.
- Cards marked "You match" meet the campaign's requirements; the others show what is missing. Say how many of the results they match, without guessing details you cannot see.
- Every new request starts fresh. Keep filters from an earlier message only when the creator clearly refines it (more, also, sort those, only those, same but...). A new "suggest campaigns" request must not inherit paid/barter, city or category from before. Always name the filters you used.
- "Posted in the last 24 hours / today / this week" means posted_within_hours (24, 24, 168). It is NOT the deadline. "Closing soon / ending this week" means closing_within_days. Never say you cannot filter by when a campaign was posted or closes.
- If the tool says gambling, betting or casino campaigns are not suggested, tell the creator that plainly. Never say "none matched" in that case.
- Payment: for paid campaigns only use payment_type='paid'; for barter only use payment_type='barter'. Never say you cannot filter by paid or barter.
- Location: campaigns have no location setting. A city search shows campaigns from brands based in that city (or mentioning it) first, then automatically brands in the same state, nearest first. Say briefly where the results come from, using the tool's "By place" note. When the tool says nothing more is left, do NOT search again: ask the creator which they prefer, (a) campaigns from anywhere in India with the same filters, or (b) campaigns from that city and nearby with other categories (only offer (b) if a category filter was used). After they answer, search again with more_results=true: for (a) leave out city; for (b) keep city and leave out category. If anywhere-in-India is also used up, offer (b). Never choose for them.
- Cards shown earlier in this chat came from real searches. Never say an earlier answer was fake or apologise for it unless a tool returned an error. If the creator pastes test notes or instructions instead of a question, answer the actual request.
- You never apply to a campaign for the creator. Tell them to open the card and apply from the campaign page.
- Show at most ${MAX_CARDS} cards per reply. If they ask for more than that, search with limit ${MAX_CARDS}, say you show ${MAX_CARDS} at a time, and offer more. For more / others / next, repeat the same filters with more_results=true. For a changed request, do not set it.
- Campaigns the creator already applied to are hidden from search results.
- After searching, write one or two short sentences: which filters you used, and how many campaigns matched in total. If nothing matched, say so and suggest loosening the least important filter; say exactly which one you loosened.
- For questions about applications, use get_my_applications and report each status exactly as returned. Never promise payments or outcomes.`;

// creators / campaigns already shown as cards earlier in this chat
const loadShownIds = async (conversationId) => {
  if (!conversationId) return new Set();
  const msgs = await AssistantMessage.find({ conversationId, role: 'assistant', 'cards.0': { $exists: true } })
    .select('cards.creatorId cards.openingId')
    .sort({ createdAt: -1 })
    .limit(40)
    .lean();
  const ids = new Set();
  msgs.forEach((m) => (m.cards || []).forEach((c) => {
    const id = c?.creatorId || c?.openingId;
    if (id) ids.add(String(id));
  }));
  return ids;
};

const cardKey = (c) => c.creatorId || c.openingId;

const mergeCards = (existing, incoming) => {
  const seen = new Set(existing.map(cardKey));
  const out = [...existing];
  for (const c of incoming) {
    if (out.length >= MAX_CARDS) break;
    if (seen.has(cardKey(c))) continue;
    seen.add(cardKey(c));
    out.push(c);
  }
  return out;
};

const runAssistant = async ({ user, system, history, conversationId }) => {
  const tools = toolsForRole(user.role);
  const ctx = { role: user.role, userId: user.id, brand: null, creator: null, shownIds: new Set(), turnIds: new Set() };
  let rules = '';
  if (user.role === 'brand') {
    ctx.brand = await Brand.findOne({ userId: user.id }).select('category location').lean();
    ctx.shownIds = await loadShownIds(conversationId);
    rules = BRAND_SEARCH_RULES;
  } else if (user.role === 'creator') {
    ctx.creator = await Creator.findOne({ userId: user.id })
      .select('categories location instagram.followersCount instagram.engagementRate')
      .lean();
    ctx.shownIds = await loadShownIds(conversationId);
    rules = CREATOR_SEARCH_RULES;
  }
  const fullSystem = rules ? `${system}\n\n${rules}` : system;

  const messages = [...history];
  let cards = [];
  let inputTokens = 0;
  let outputTokens = 0;
  let model;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const reply = await generateReply({ system: fullSystem, messages, tools });
    inputTokens += reply.inputTokens;
    outputTokens += reply.outputTokens;
    model = reply.model;

    if (reply.stopReason !== 'tool_use') {
      let finalText = (reply.text || '').trim();
      if (!finalText) {
        console.warn('Assistant returned no text. stop_reason =', reply.stopReason);
        if (cards.length) finalText = cards.length === 1 ? 'Here is what I found.' : `Here are ${cards.length} results I found.`;
      }
      return { text: finalText, cards, inputTokens, outputTokens, model };
    }

    // keep the AI's own turn (including its tool calls) in the conversation
    messages.push({ role: 'assistant', content: reply.content });

    const results = [];
    for (const block of reply.content) {
      if (block.type !== 'tool_use') continue;
      try {
        const out = await runTool(block.name, block.input, ctx);
        if (out.cards) cards = mergeCards(cards, out.cards);
        results.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: out.content,
          ...(out.isError ? { is_error: true } : {}),
        });
      } catch (err) {
        console.error('Assistant tool error:', block.name, err.message);
        results.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: 'The tool failed. Tell the user you could not complete the search right now.',
          is_error: true,
        });
      }
    }
    messages.push({ role: 'user', content: results });
  }

  return {
    text: cards.length
      ? 'Here are the results I found so far. Tell me what to adjust and I will search again.'
      : "I wasn't able to finish that search. Could you try again with a few more details?",
    cards,
    inputTokens,
    outputTokens,
    model,
  };
};

module.exports = { runAssistant };