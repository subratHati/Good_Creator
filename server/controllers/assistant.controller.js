const AssistantConversation = require('../models/AssistantConversation');
const AssistantMessage = require('../models/AssistantMessage');
const AdminConversation = require('../models/AdminConversation');
const { isEnabled } = require('../services/assistant/llm');
const { runAssistant } = require('../services/assistant/engine');
const { buildSystemPrompt } = require('../services/assistant/prompt');
const { pushAssistantMessage } = require('../services/assistant/notify');

const MAX_INPUT_CHARS = 1000;
const HISTORY_LIMIT = 12; // how many recent messages the AI sees
const DAILY_LIMIT = Number(process.env.ASSISTANT_DAILY_LIMIT) || 30;

// Fixed welcome message: no AI call, so it costs nothing.
const GREETINGS = {
  creator: `Hi! 👋 I'm the GoodCreator Assistant, an AI here to help you get the most out of GoodCreator.

Ask me anything about applying to campaigns, setting up your profile, connecting Instagram, or how collaborations and payments work. Nothing is too small to ask!

If you ever need a person from our team, use Contact/Help in the app.`,
  brand: `Hi! 👋 I'm the GoodCreator Assistant, an AI here to help your brand get the most out of GoodCreator.

Ask me anything about posting campaigns, working with creators, or how paying and approving deliveries works. Nothing is too small to ask!

If you ever need a person from our team, use Contact/Help in the app.`,
};

const allowedRole = (user) => ['creator', 'brand'].includes(user.role);

const getOrCreateConversation = (user) =>
  AssistantConversation.findOneAndUpdate(
    { userId: user.id },
    { $setOnInsert: { userId: user.id, userRole: user.role } },
    { upsert: true, new: true }
  );

// Creates the one-time welcome message. The greeted false -> true flip is atomic,
// so two requests at the same moment can never create two greetings.
const ensureGreeting = async (conversation) => {
  if (conversation.greeted) return conversation;
  const flipped = await AssistantConversation.findOneAndUpdate(
    { _id: conversation._id, greeted: false },
    { greeted: true },
    { new: true }
  );
  if (!flipped) return conversation;
  const text = GREETINGS[conversation.userRole];
  await AssistantMessage.create({ conversationId: conversation._id, role: 'assistant', text });
  return AssistantConversation.findByIdAndUpdate(
    conversation._id,
    { lastMessage: text.slice(0, 200), lastMessageAt: new Date(), $inc: { unreadByUser: 1 } },
    { new: true }
  );
};

// GET /api/assistant/mine  -> summary for the Messages list (does not clear unread)
const getMyAssistantConversation = async (req, res) => {
  try {
    if (!isEnabled() || !allowedRole(req.user)) return res.json({ conversation: null });
    let conversation = await getOrCreateConversation(req.user);
    conversation = await ensureGreeting(conversation);
    res.json({ conversation });
  } catch (error) {
    console.error('getMyAssistantConversation error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/assistant/messages  -> opens the chat, clears unread
const getAssistantMessages = async (req, res) => {
  try {
    if (!isEnabled() || !allowedRole(req.user)) return res.json({ conversation: null, messages: [] });
    let conversation = await getOrCreateConversation(req.user);
    conversation = await ensureGreeting(conversation);
    const messages = await AssistantMessage.find({ conversationId: conversation._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    messages.reverse();
    await AssistantConversation.findByIdAndUpdate(conversation._id, { unreadByUser: 0, ignoredCheckins: 0 });
    res.json({ conversation, messages });
  } catch (error) {
    console.error('getAssistantMessages error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/assistant/support-unread
// One cheap call for the nav badge: unread admin messages + unread assistant messages.
// Also creates the welcome message the first time it runs for a user.
const getSupportUnreadCount = async (req, res) => {
  try {
    if (!allowedRole(req.user)) return res.json({ unreadCount: 0 });
    const adminConv = await AdminConversation.findOne({ userId: req.user.id }).select('unreadByUser').lean();
    let total = adminConv?.unreadByUser || 0;

    if (isEnabled()) {
      let conversation = await AssistantConversation.findOne({ userId: req.user.id });
      if (!conversation || !conversation.greeted) {
        conversation = await getOrCreateConversation(req.user);
        conversation = await ensureGreeting(conversation);
      }
      total += conversation.unreadByUser || 0;
    }
    res.json({ unreadCount: total });
  } catch (error) {
    console.error('getSupportUnreadCount error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/assistant/messages  { text }
const sendAssistantMessage = async (req, res) => {
  try {
    if (!isEnabled()) return res.status(503).json({ message: 'The assistant is not available right now.' });
    if (!allowedRole(req.user)) return res.status(403).json({ message: 'Not available for this account' });

    // remember if the person leaves (closes the app) while the AI is still working
    let clientGone = false;
    res.on('close', () => { if (!res.writableFinished) clientGone = true; });

    const text = String(req.body.text || '').trim();
    if (!text) return res.status(400).json({ message: 'Message is empty' });
    if (text.length > MAX_INPUT_CHARS) {
      return res.status(400).json({ message: `Please keep messages under ${MAX_INPUT_CHARS} characters` });
    }

    const conversation = await getOrCreateConversation(req.user);

    // per-user cap over the last 24 hours, so one user can't run up the bill
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const used = await AssistantMessage.countDocuments({
      conversationId: conversation._id,
      role: 'user',
      createdAt: { $gte: since },
    });
    if (used >= DAILY_LIMIT) {
      return res.status(429).json({
        code: 'DAILY_LIMIT',
        message: "You've reached today's message limit for the assistant. Please try again tomorrow.",
      });
    }

    const userMessage = await AssistantMessage.create({ conversationId: conversation._id, role: 'user', text });

    // recent history, oldest first; Claude needs the first turn to be from the user
    const recent = await AssistantMessage.find({ conversationId: conversation._id })
      .sort({ createdAt: -1 })
      .limit(HISTORY_LIMIT)
      .lean();
    const history = recent.reverse().map((m) => ({ role: m.role, content: m.text }));
    while (history.length && history[0].role !== 'user') history.shift();

    let reply;
    try {
      reply = await runAssistant({ user: req.user, system: buildSystemPrompt(req.user.role), history, conversationId: conversation._id });
    } catch (err) {
      console.error('Assistant model error:', err.status, err.message);
      // remove the unanswered message so a retry doesn't leave a dangling turn
      await AssistantMessage.findByIdAndDelete(userMessage._id);
      return res.status(503).json({ message: 'The assistant could not reply right now. Please try again.' });
    }

    const replyText = reply.text || "Sorry, I couldn't come up with an answer. Could you rephrase that?";
    const assistantMessage = await AssistantMessage.create({
      conversationId: conversation._id,
      role: 'assistant',
      text: replyText,
      model: reply.model,
      inputTokens: reply.inputTokens,
      outputTokens: reply.outputTokens,
      cards: reply.cards,
    });

    // if the person left while the AI was working, keep the reply as unread and push it
    await AssistantConversation.findByIdAndUpdate(conversation._id, {
      lastMessage: replyText.slice(0, 200),
      lastMessageAt: new Date(),
      ...(clientGone ? { $inc: { unreadByUser: 1 } } : {}),
    });

    if (clientGone) pushAssistantMessage(req.user.id, replyText);

    res.status(201).json({ userMessage, assistantMessage });

  } catch (error) {
    console.error('sendAssistantMessage error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getMyAssistantConversation,
  getAssistantMessages,
  getSupportUnreadCount,
  sendAssistantMessage,
};