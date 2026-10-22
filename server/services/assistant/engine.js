const { generateReply } = require('./llm');
const { toolsForRole, runTool, MAX_CARDS } = require('./tools');
const Brand = require('../../models/Brand');
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

// creators already shown as cards earlier in this chat
const loadShownCreatorIds = async (conversationId) => {
  if (!conversationId) return new Set();
  const msgs = await AssistantMessage.find({ conversationId, role: 'assistant', 'cards.0': { $exists: true } })
    .select('cards.creatorId')
    .sort({ createdAt: -1 })
    .limit(40)
    .lean();
  const ids = new Set();
  msgs.forEach((m) => (m.cards || []).forEach((c) => c?.creatorId && ids.add(String(c.creatorId))));
  return ids;
};

const mergeCards = (existing, incoming) => {
  const seen = new Set(existing.map((c) => c.creatorId));
  const out = [...existing];
  for (const c of incoming) {
    if (out.length >= MAX_CARDS) break;
    if (seen.has(c.creatorId)) continue;
    seen.add(c.creatorId);
    out.push(c);
  }
  return out;
};

const runAssistant = async ({ user, system, history, conversationId }) => {
  const tools = toolsForRole(user.role);
  const ctx = { role: user.role, userId: user.id, brand: null, shownIds: new Set(), turnIds: new Set() };
  if (user.role === 'brand') {
    ctx.brand = await Brand.findOne({ userId: user.id }).select('category location').lean();
    ctx.shownIds = await loadShownCreatorIds(conversationId);
  }
  const fullSystem = user.role === 'brand' ? `${system}\n\n${BRAND_SEARCH_RULES}` : system;

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
        if (cards.length) finalText = cards.length === 1 ? 'Here is the creator I found.' : `Here are ${cards.length} creators I found.`;
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
      ? 'Here are the creators I found so far. Tell me what to adjust and I will search again.'
      : "I wasn't able to finish that search. Could you try again with a few more details?",
    cards,
    inputTokens,
    outputTokens,
    model,
  };
};

module.exports = { runAssistant };