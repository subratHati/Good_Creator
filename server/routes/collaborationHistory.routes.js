const express = require('express');
const router = express.Router();
const { getMyCollabHistory } = require('../controllers/collaborationHistory.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/mine', protect, getMyCollabHistory);

module.exports = router;
