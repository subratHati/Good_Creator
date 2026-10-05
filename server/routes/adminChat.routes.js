const express = require('express');
const router = express.Router();
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
