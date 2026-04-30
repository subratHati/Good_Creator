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

// public
router.get('/search', searchOpenings);

// brand protected
router.get('/my', protect, isBrand, getMyOpenings);
router.post('/', protect, isBrand, createOpening);
router.put('/:id', protect, isBrand, updateOpening);
router.delete('/:id', protect, isBrand, deleteOpening);

// public — always last
router.get('/:id', getOpeningById);

module.exports = router;