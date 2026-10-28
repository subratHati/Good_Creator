const sendPushNotification = require('../../utils/sendPushNotification');

// where tapping the notification opens the assistant chat
// (I'll confirm this path against App.jsx; change it here if needed)
const ASSISTANT_CHAT_PATH = '/messages/assistant';

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

module.exports = { isUserOnline, pushAssistantMessage, ASSISTANT_CHAT_PATH };