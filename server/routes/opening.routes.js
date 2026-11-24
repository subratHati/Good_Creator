const express = require('express');
const router = express.Router();
const {
  createOpening,
  getMyOpenings,
  updateOpening,
  deleteOpening,
  searchOpenings,
  getOpeningById,
} = require('../controllers/opening.controller');
const { protect } = require('../middleware/auth.middleware');
const { isBrand } = require('../middleware/role.middleware');
const { requireVerifiedBrand } = require('../middleware/verifiedBrand.middleware');

// public
router.get('/search', searchOpenings);

// brand protected
router.get('/my', protect, isBrand, getMyOpenings);
// creating or changing campaigns needs an admin-verified brand
router.post('/', protect, isBrand, requireVerifiedBrand, createOpening);
router.put('/:id', protect, isBrand, requireVerifiedBrand, updateOpening);
router.delete('/:id', protect, isBrand, requireVerifiedBrand, deleteOpening);

// public — always last
router.get('/:id', getOpeningById);

module.exports = router;