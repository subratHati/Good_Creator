const express = require('express');
const router = express.Router();
const { getUserAnalytics, getCampaignAnalytics, getCollabAnalytics, getRegistrationTrend } = require('../controllers/analytics.controller');
const { protect } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/role.middleware');
const { getBrandsWithConversations, exportBrandConversations } = require('../controllers/conversationAnalytics.controller');

router.get('/users', protect, isAdmin, getUserAnalytics);
router.get('/campaigns', protect, isAdmin, getCampaignAnalytics);
router.get('/collabs', protect, isAdmin, getCollabAnalytics);
router.get('/conversation-brands', protect, isAdmin, getBrandsWithConversations);
router.get('/conversation-brands/:brandId/export', protect, isAdmin, exportBrandConversations);
router.get('/registration-trend', protect, isAdmin, getRegistrationTrend);

module.exports = router;
