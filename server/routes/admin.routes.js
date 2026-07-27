const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/role.middleware');
const {
  getAllCreators,
  getAllBrands,
  sendMessage,
  getReferralStats,
} = require('../controllers/admin.controller');

// every route here is admin-only — protect verifies the JWT and loads
// req.user, isAdmin then checks req.user.role === 'admin'
router.get('/creators', protect, isAdmin, getAllCreators);
router.get('/brands', protect, isAdmin, getAllBrands);
router.post('/send-message', protect, isAdmin, sendMessage);
router.get('/referral-stats', protect, isAdmin, getReferralStats);

module.exports = router;
