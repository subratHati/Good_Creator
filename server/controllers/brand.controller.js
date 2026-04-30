const Brand = require('../models/Brand');
const Creator = require('../models/Creator');

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

    const profileData = {
      userId: req.user.id,
      ...req.body,
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
    const updateData = { ...req.body };

    if (req.file) {
      updateData.logo = req.file.path;
    }

    const brand = await Brand.findOneAndUpdate(
      { userId: req.user.id },
      { $set: updateData },
      { new: true, runValidators: true, upsert: true }
    );

    res.json({ message: 'Profile updated successfully', brand });
  } catch (error) {
    console.error('updateProfile error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/brands/:id  (public)
const getPublicProfile = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id)
      .select('-instagram.accessToken')
      .populate('savedCreators', 'name profilePhoto instagram.handle instagram.followersCount');
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }
    res.json({ brand });
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

module.exports = {
  getMyProfile,
  createProfile,
  updateProfile,
  getPublicProfile,
  saveCreator,
};