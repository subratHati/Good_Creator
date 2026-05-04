// const express = require('express');
// const router = express.Router();
// const { protect } = require('../middleware/auth.middleware');
// const {
//   getAuthUrl,
//   connectInstagram,
//   selectInstagramAccount,
//   syncInstagram,
//   disconnectInstagram,
// } = require('../controllers/instagram.controller');

// router.get('/auth-url', protect, getAuthUrl);
// router.post('/connect', protect, connectInstagram);
// router.post('/select-account', protect, selectInstagramAccount);
// router.post('/sync', protect, syncInstagram);
// router.post('/disconnect', protect, disconnectInstagram);

// module.exports = router;



const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  getAuthUrl,
  connectInstagram,
  syncInstagram,
  disconnectInstagram,
} = require('../controllers/instagram.controller');

router.get('/auth-url', protect, getAuthUrl);
router.post('/connect', protect, connectInstagram);
router.post('/sync', protect, syncInstagram);
router.post('/disconnect', protect, disconnectInstagram);

module.exports = router;