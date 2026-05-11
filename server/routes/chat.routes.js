const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const { protect } = require('../middleware/auth.middleware');
const {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  getUnreadCount,
  getConversationById
} = require('../controllers/chat.controller');

router.get('/conversations', protect, getConversations);
router.post('/conversations', protect, getOrCreateConversation);
router.get('/conversations/:id/messages', protect, getMessages);
router.post('/conversations/:id/messages', protect, sendMessage);
router.get('/unread', protect, getUnreadCount);
router.get('/conversations/:id', protect, getConversationById);


module.exports = router;
