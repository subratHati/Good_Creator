const Brand = require('../models/Brand');
const { isBrandVerified, effectiveStatus, NOT_VERIFIED_CODE, NOT_VERIFIED_MESSAGE } = require('../utils/brandVerification');

// Use AFTER protect (and normally after isBrand). Lets the request through only
// when the logged-in user is a brand that an admin has verified. The brand
// record is read from the database on every request, so the moment an admin
// changes the status, it takes effect - there is nothing cached to go stale.
//
// On success the brand record is available as req.brand, so the controller
// does not have to load it again.
const requireVerifiedBrand = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'brand') {
      return res.status(403).json({ message: 'Access denied- brands only' });
    }
    const brand = await Brand.findOne({ userId: req.user._id });
    if (!brand) {
      return res.status(404).json({ message: 'Brand profile not found. Create your brand profile first.' });
    }
    if (!isBrandVerified(brand)) {
      return res.status(403).json({
        message: NOT_VERIFIED_MESSAGE,
        code: NOT_VERIFIED_CODE,
        verificationStatus: effectiveStatus(brand),
      });
    }
    req.brand = brand;
    next();
  } catch (error) {
    console.error('requireVerifiedBrand error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { requireVerifiedBrand };
