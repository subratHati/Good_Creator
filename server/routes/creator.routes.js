
const express = require('express');
const router = express.Router();
const {
  getMyProfile,
  createProfile,
  updateProfile,
  getPublicProfile,
  searchCreators,
} = require('../controllers/creator.controller');
const { protect } = require('../middleware/auth.middleware');
const { isCreator } = require('../middleware/role.middleware');
const { uploadSingle } = require('../middleware/upload.middleware');

// public routes — most specific first
router.get('/search', searchCreators);

// protected creator-only routes
router.get('/me', protect, isCreator, getMyProfile);
router.post('/profile', protect, isCreator, uploadSingle('profilePhoto'), createProfile);

// split update routes — text only vs photo upload
router.put('/profile/details', protect, isCreator, updateProfile);
router.put('/profile/photo', protect, isCreator, uploadSingle('profilePhoto'), updateProfile);

// dynamic route — always last
router.get('/:id', getPublicProfile);

module.exports = router;