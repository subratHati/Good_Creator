const express = require('express');
const router = express.Router();
const {
  getCreatorCollaborations,
  getBrandCollaborations,
} = require('../controllers/collaboration.controller');
const { protect } = require('../middleware/auth.middleware');
const { isCreator, isBrand } = require('../middleware/role.middleware');

router.get('/creator', protect, isCreator, getCreatorCollaborations);
router.get('/brand', protect, isBrand, getBrandCollaborations);

module.exports = router;
