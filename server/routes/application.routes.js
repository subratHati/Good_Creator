const express = require('express');
const router = express.Router();
const {
  applyToOpening,
  getMyApplications,
  getOpeningApplicants,
  updateApplicationStatus,
} = require('../controllers/application.controller');
const { protect } = require('../middleware/auth.middleware');
const { isCreator, isBrand } = require('../middleware/role.middleware');

router.post('/apply', protect, isCreator, applyToOpening);
router.get('/my', protect, isCreator, getMyApplications);
router.get('/opening/:openingId', protect, isBrand, getOpeningApplicants);
router.put('/:id/status', protect, isBrand, updateApplicationStatus);

module.exports = router;