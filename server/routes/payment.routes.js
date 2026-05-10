const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { isCreator, isBrand } = require('../middleware/role.middleware');
const {
  createOrder,
  verifyPayment,
  releasePayment,
  getCreatorBankDetails,
  saveCreatorBankDetails,
} = require('../controllers/payment.controller');

router.post('/create-order', protect, isBrand, createOrder);
router.post('/verify', protect, isBrand, verifyPayment);
router.post('/release', protect, isBrand, releasePayment);
router.get('/creator-bank', protect, isCreator, getCreatorBankDetails);
router.put('/creator-bank', protect, isCreator, saveCreatorBankDetails);

module.exports = router;
