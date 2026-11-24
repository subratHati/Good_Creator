const Brand = require('../models/Brand');
const Creator = require('../models/Creator');
const { cleanBrandInput, flatten } = require('../utils/profileInput');
const { checkPickedLocation } = require('../utils/places');
const { STATUS, isBrandVerified, PRIVATE_BRAND_FIELDS, checkVerifiedBrandEdit, backToWaiting } = require('../utils/brandVerification');

// What a verified brand may change, and what sends it back for another check, is
// decided in utils/brandVerification.js (checkVerifiedBrandEdit).

// GET /api/brands/me
const getMyProfile = async (req, res) => {
  try {
    const brand = await Brand.findOne({ userId: req.user.id });
    if (!brand) {
      return res.status(404).json({ message: 'Brand profile not found' });
    }
    res.json({ brand });
  } catch (error) {
    console.error('getMyProfile error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/brands/profile
const createProfile = async (req, res) => {
  try {
    const existing = await Brand.findOne({ userId: req.user.id });
    if (existing) {
      return res.status(400).json({ message: 'Profile already exists, use PUT to update' });
    }

    // only the allowed fields are read from the request
    const { data, error } = cleanBrandInput(req.body, { isCreate: true });
    if (error) return res.status(400).json({ message: error });

    const profileData = {
      ...data,
      userId: req.user.id,
      // every new brand starts as "pending" until an admin verifies it. This is
      // set here on the server - nothing from the request can change it.
      verification: { status: STATUS.PENDING, requestedAt: new Date() },
    };

    if (req.file) {
      profileData.logo = req.file.path;
    }

    const brand = await Brand.create(profileData);
    res.status(201).json({ message: 'Brand profile created successfully', brand });
  } catch (error) {
    console.error('createProfile error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/brands/profile
const updateProfile = async (req, res) => {
  try {
    // only the allowed fields are read from the request
    const { data, error } = cleanBrandInput(req.body);
    if (error) return res.status(400).json({ message: error });

    const updateData = flatten(data);
    // a proper location saved here also ends the "please set your location" pop-up
    if (data.location && checkPickedLocation(data.location.city, data.location.state).ok) updateData.locationReview = false;

    if (req.file) {
      updateData.logo = req.file.path;
    }

    const current = await Brand.findOne({ userId: req.user.id });
    if (!current) {
      return res.status(404).json({ message: 'Brand profile not found' });
    }
    let sentBackForReview = false;
    if (isBrandVerified(current)) {
      const check = checkVerifiedBrandEdit(current, data);
      // name, category, GSTIN and UDYAM cannot be changed once verified
      if (check.locked) {
        return res.status(400).json({
          message: `${check.locked} cannot be changed after your brand is verified.`,
          code: 'BRAND_FIELD_LOCKED',
          field: check.locked,
        });
      }
      // changing the phone, website or Instagram handle, or adding one of the
      // details, sends the brand back to "waiting" so the team checks it again
      if (check.changed.length) {
        Object.assign(updateData, backToWaiting(check.changed));
        sentBackForReview = true;
      }
    }

    const brand = await Brand.findOneAndUpdate(
      { userId: req.user.id },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!brand) {
      return res.status(404).json({ message: 'Brand profile not found' });
    }

    res.json({ message: 'Profile updated successfully', brand, sentBackForReview });
  } catch (error) {
    console.error('updateProfile error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/brands/request-verification
// A brand that was marked "not verified" fixes its details and asks again. It
// goes back into the admin queue as "pending". This is the only thing a brand
// can do to its own verification status - and only from "not verified".
const requestVerification = async (req, res) => {
  try {
    const brand = await Brand.findOneAndUpdate(
      { userId: req.user.id, 'verification.status': STATUS.NOT_VERIFIED },
      { $set: { 'verification.status': STATUS.PENDING, 'verification.requestedAt': new Date() } },
      { new: true }
    );
    if (!brand) {
      return res.status(400).json({ message: 'There is nothing to send for verification right now' });
    }
    res.json({ message: 'Sent for verification again. We will get back to you within 24 hours.', brand });
  } catch (error) {
    console.error('requestVerification error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/brands/:id  (public)
// Only verified brands are visible to the public. The owner and admins can still
// open their own / any brand. What is returned is a short allow-list - phone,
// GSTIN, UDYAM, the admin's notes and the saved-creators list are never public.
const PUBLIC_BRAND_FIELDS = 'brandName logo website description category location instagram.handle instagram.followersCount instagram.profilePicUrl instagram.isVerified instagram.lastSynced createdAt userId verification.status';

const getPublicProfile = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id).select(PUBLIC_BRAND_FIELDS);
    const viewerId = req.user ? String(req.user._id) : null;
    const canSee = brand && (
      isBrandVerified(brand) ||
      (viewerId && String(brand.userId) === viewerId) ||
      (req.user && req.user.role === 'admin')
    );
    if (!canSee) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    const result = brand.toObject();
    result.isVerified = isBrandVerified(brand);
    PRIVATE_BRAND_FIELDS.forEach((field) => delete result[field]);
    res.json({ brand: result });
  } catch (error) {
    console.error('getPublicProfile error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/brands/save-creator/:creatorId
const saveCreator = async (req, res) => {
  try {
    const brand = await Brand.findOne({ userId: req.user.id });
    if (!brand) {
      return res.status(404).json({ message: 'Brand profile not found' });
    }

    const creatorId = req.params.creatorId;
    const alreadySaved = brand.savedCreators.includes(creatorId);

    if (alreadySaved) {
      brand.savedCreators = brand.savedCreators.filter(
        (id) => id.toString() !== creatorId
      );
    } else {
      brand.savedCreators.push(creatorId);
    }

    await brand.save();

    res.json({
      message: alreadySaved ? 'Creator removed from saved' : 'Creator saved',
      savedCreators: brand.savedCreators,
    });
  } catch (error) {
    console.error('saveCreator error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/brands/saved-creators
const getSavedCreators = async (req, res) => {
  try {
    const brand = await Brand.findOne({ userId: req.user.id })
      .populate('savedCreators', 'name profilePhoto instagram.handle instagram.isConnected instagram.isManuallyAdded instagram.followersCount instagram.avgReach instagram.avgLikes instagram.avgViews instagram.avgComments instagram.avgSaved instagram.avgShares instagram.engagementRate instagram.lastSynced categories pricing location isOpenForCollab barterEnabled isAdminVerified');

    if (!brand) {
      return res.status(404).json({ message: 'Brand profile not found' });
    }

    res.json({ savedCreators: brand.savedCreators });
  } catch (error) {
    console.error('getSavedCreators error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getMyProfile,
  createProfile,
  updateProfile,
  requestVerification,
  getPublicProfile,
  saveCreator,
  getSavedCreators,
};