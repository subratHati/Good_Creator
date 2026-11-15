const express = require('express');
const router = express.Router();
const { getAssistantChatList, getAssistantChat } = require('../controllers/adminAssistant.controller');
const { protect } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/role.middleware');

// admin-only and read-only: there is deliberately no route that writes anything
router.get('/list', protect, isAdmin, getAssistantChatList);
router.get('/:conversationId', protect, isAdmin, getAssistantChat);

module.exports = router;
