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
  max: Number(process.env.ASSISTANT_PER_MINUTE) || 12,
  message: { message: 'Too many messages, please slow down a little.' },
});

router.get('/mine', protect, getMyAssistantConversation);
router.get('/messages', protect, getAssistantMessages);
router.get('/support-unread', protect, getSupportUnreadCount);
router.post('/messages', protect, assistantLimiter, sendAssistantMessage);

// turn the daily check-ins on or off
router.put('/settings', protect, async (req, res) => {
  try {
    if (!['creator', 'brand'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not available for this account' });
    }
    const AssistantConversation = require('../models/AssistantConversation');
    const enabled = !(req.body.checkinsEnabled === false || req.body.checkinsEnabled === 'false');
    const conversation = await AssistantConversation.findOneAndUpdate(
      { userId: req.user.id },
      {
        $set: { checkinsEnabled: enabled, ...(enabled ? { ignoredCheckins: 0 } : {}) },
        $setOnInsert: { userRole: req.user.role },
      },
      { upsert: true, returnDocument: 'after' }
    );
    res.json({ checkinsEnabled: conversation.checkinsEnabled });
  } catch (error) {
    console.error('assistant settings error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;