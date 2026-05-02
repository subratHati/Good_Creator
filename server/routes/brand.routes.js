const express = require('express');
const router = express.Router();
const {
  getMyProfile,
  createProfile,
  updateProfile,
  getPublicProfile,
  saveCreator,
  getSavedCreators,
} = require('../controllers/brand.controller');
const { protect } = require('../middleware/auth.middleware');
const { isBrand } = require('../middleware/role.middleware');
const { uploadSingle } = require('../middleware/upload.middleware');



// protected brand-only routes
router.get('/me', protect, isBrand, getMyProfile);
router.post('/profile', protect, isBrand, uploadSingle('logo'), createProfile);
router.put('/profile', protect, isBrand, updateProfile);
router.put('/profile/logo', protect, isBrand, uploadSingle('logo'), updateProfile);
router.put('/save-creator/:creatorId', protect, isBrand, saveCreator);
router.get('/saved-creators', protect, isBrand, getSavedCreators);

// public routes
router.get('/:id', getPublicProfile);

module.exports = router;