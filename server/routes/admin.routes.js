const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/role.middleware');
const {
  getAllCreators,
  getAllBrands,
  sendMessage,
  getReferralStats,
  listBrandVerifications,
  reviewBrandVerification,
} = require('../controllers/admin.controller');

// every route here is admin-only — protect verifies the JWT and loads
// req.user, isAdmin then checks req.user.role === 'admin'
router.get('/creators', protect, isAdmin, getAllCreators);
router.get('/brands', protect, isAdmin, getAllBrands);
router.post('/send-message', protect, isAdmin, sendMessage);
router.get('/referral-stats', protect, isAdmin, getReferralStats);
// brand verification - the only place a brand can be marked verified
router.get('/brand-verifications', protect, isAdmin, listBrandVerifications);
router.put('/brand-verifications/:brandId', protect, isAdmin, reviewBrandVerification);

module.exports = router;
