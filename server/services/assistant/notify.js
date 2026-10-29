const sendPushNotification = require('../../utils/sendPushNotification');
const AssistantMessage = require('../../models/AssistantMessage');
const AssistantConversation = require('../../models/AssistantConversation');

// where tapping the notification opens the assistant chat
const ASSISTANT_CHAT_PATH = '/messages/assistant';

// how long to wait for the app to confirm it showed a reply
const MISSED_REPLY_DELAY_MS = 15000;

// true if this user has the app open right now (their live-connection room is not empty)
const isUserOnline = (io, userId) => {
  try {
    const room = io && io.sockets && io.sockets.adapter.rooms.get(`user_${userId}`);
    return !!room && room.size > 0;
  } catch {
    return false;
  }
};

// fire-and-forget push, same style as the chat messages
const pushAssistantMessage = (userId, text) => {
  const flat = String(text || '').replace(/\s+/g, ' ').trim();
  const body = flat.length > 100 ? `${flat.slice(0, 100)}…` : flat;
  sendPushNotification(String(userId), {
    title: 'GoodCreator Assistant',
    body: body || 'You have a new message',
    url: ASSISTANT_CHAT_PATH,
    skipIfVisible: true, // the service worker hides it if the app is open on screen
  }).catch(() => { });
};

// If the app does not confirm within 15 seconds that it showed this reply, the person
// has left: keep the reply as unread and send a push notification.
const scheduleMissedReplyCheck = ({ messageId, conversationId, userId, text }) => {
  setTimeout(async () => {
    try {
      const message = await AssistantMessage.findById(messageId).select('ackedAt').lean();
      if (!message || message.ackedAt) return;
      await AssistantConversation.updateOne({ _id: conversationId }, { $inc: { unreadByUser: 1 } });
      pushAssistantMessage(userId, text);
    } catch (err) {
      console.error('[ASSISTANT] missed-reply check failed:', err.message);
    }
  }, MISSED_REPLY_DELAY_MS);
};

module.exports = { isUserOnline, pushAssistantMessage, scheduleMissedReplyCheck, ASSISTANT_CHAT_PATH };