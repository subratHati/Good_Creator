const express = require('express');
const router = express.Router();
const { getUserAnalytics, getCampaignAnalytics, getCollabAnalytics } = require('../controllers/analytics.controller');
const { protect } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/role.middleware');

router.get('/users', protect, isAdmin, getUserAnalytics);
router.get('/campaigns', protect, isAdmin, getCampaignAnalytics);
router.get('/collabs', protect, isAdmin, getCollabAnalytics);

module.exports = router;
