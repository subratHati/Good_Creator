const express = require('express');
const router = express.Router();
const {
  sendEnquiry,
  getReceivedEnquiries,
  markSeen,
} = require('../controllers/enquiry.controller');
const { protect } = require('../middleware/auth.middleware');
const { isCreator, isBrand } = require('../middleware/role.middleware');

router.post('/', protect, isBrand, sendEnquiry);
router.get('/received', protect, isCreator, getReceivedEnquiries);
router.put('/:id/seen', protect, isCreator, markSeen);

module.exports = router;