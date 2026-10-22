const express = require('express');
const router = express.Router();

// reject malformed ids (like the literal string "undefined") with a clear 400
// instead of letting Mongoose throw a CastError that becomes a 500
router.param('conversationId', (req, res, next, id) => {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    return res.status(400).json({ message: 'Invalid conversation id' });
  }
  next();
});

const {
  getAdminChatList,
  startAdminConversation,
  getMyAdminConversation,
  getAdminMessages,
  sendAdminMessage,
  getAdminUnreadCount,
} = require('../controllers/adminChat.controller');
const { protect } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/role.middleware');

// admin-only
router.get('/list', protect, isAdmin, getAdminChatList);
router.post('/start', protect, isAdmin, startAdminConversation);

// creator/brand side
router.get('/mine', protect, getMyAdminConversation);
router.get('/unread-count', protect, getAdminUnreadCount);

// shared — both admin and the specific user own conversation can use these
router.get('/:conversationId/messages', protect, getAdminMessages);
router.post('/:conversationId/messages', protect, sendAdminMessage);

module.exports = router;
