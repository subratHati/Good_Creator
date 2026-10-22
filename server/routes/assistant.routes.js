const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const {
  getMyAssistantConversation,
  getAssistantMessages,
  getSupportUnreadCount,
  sendAssistantMessage,
} = require('../controllers/assistant.controller');
const { protect } = require('../middleware/auth.middleware');

// burst protection on top of the per-user daily cap
const assistantLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  message: { message: 'Too many messages, please slow down a little.' },
});

router.get('/mine', protect, getMyAssistantConversation);
router.get('/messages', protect, getAssistantMessages);
router.get('/support-unread', protect, getSupportUnreadCount);
router.post('/messages', protect, assistantLimiter, sendAssistantMessage);

module.exports = router;