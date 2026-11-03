// utils/socketHandlers.js
//
// Live-chat (Socket.IO) rules:
//   1. Nobody can connect without a valid login token.
//   2. You can only join YOUR OWN user room - the id the browser sends is ignored.
//   3. You can only join a conversation room if you are the brand or creator in it.
//   4. Admin rooms are for admins only.
//   5. "typing" only works inside a conversation room you have really joined,
//      and the sender id is the real one, not whatever the browser claims.

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { loadConversationForUser } = require('./chatSafety');

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;
const isId = (value) => typeof value === 'string' && OBJECT_ID.test(value);

module.exports = function registerSocketHandlers(io) {
  // login check - runs once, when a connection is first opened
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token || typeof token !== 'string') return next(new Error('Unauthorized'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('role email');
      if (!user || (user.email && user.email.endsWith('@deleted.invalid'))) {
        return next(new Error('Unauthorized'));
      }

      socket.data.userId = String(user._id);
      socket.data.role = user.role;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, role } = socket.data;

    // the browser still sends its user id, but we ignore it and use the verified one
    socket.on('join_user', () => {
      socket.join(`user_${userId}`);
    });

    socket.on('join_conversation', async (conversationId) => {
      try {
        const access = await loadConversationForUser(conversationId, { id: userId });
        if (!access.error) socket.join(`conversation_${String(access.conversation._id)}`);
      } catch (error) {
        console.error('[SOCKET] join_conversation error:', error.message);
      }
    });

    socket.on('leave_conversation', (conversationId) => {
      if (isId(conversationId)) socket.leave(`conversation_${conversationId}`);
    });

    socket.on('typing', (data) => {
      const conversationId = data && data.conversationId;
      if (!isId(conversationId)) return;
      const room = `conversation_${conversationId}`;
      if (!socket.rooms.has(room)) return; // not a member of this chat
      socket.to(room).emit('user_typing', { userId, isTyping: data.isTyping === true });
    });

    // admin chat rooms - admins only
    socket.on('join_admin_room', () => {
      if (role === 'admin') socket.join('admin_room');
    });
    socket.on('join_admin_conversation', (conversationId) => {
      if (role === 'admin' && isId(conversationId)) socket.join(`admin_conversation_${conversationId}`);
    });
    socket.on('leave_admin_conversation', (conversationId) => {
      if (isId(conversationId)) socket.leave(`admin_conversation_${conversationId}`);
    });
  });
};