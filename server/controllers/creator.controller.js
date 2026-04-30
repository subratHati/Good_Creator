const Creator = require('../models/Creator');

// GET /api/creators/me
const getMyProfile = async (req, res) => {
  try {
    const creator = await Creator.findOne({ userId: req.user.id });
    if (!creator) {
      return res.status(404).json({ message: 'Creator profile not found' });
    }
    res.json({ creator });
  } catch (error) {
    console.error('getMyProfile error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/creators/profile
const createProfile = async (req, res) => {
  try {
    const existing = await Creator.findOne({ userId: req.user.id });
    if (existing) {
      return res.status(400).json({ message: 'Profile already exists, use PUT to update' });
    }

    const profileData = {
      userId: req.user.id,
      ...req.body,
    };

    // if photo was uploaded via cloudinary
    if (req.file) {
      profileData.profilePhoto = req.file.path;
    }

    const creator = await Creator.create(profileData);
    res.status(201).json({ message: 'Profile created successfully', creator });
  } catch (error) {
    console.error('createProfile error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/creators/profile
const updateProfile = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file) {
      updateData.profilePhoto = req.file.path;
    }

    const creator = await Creator.findOneAndUpdate(
      { userId: req.user.id },
      { $set: updateData },
      { new: true, runValidators: true, upsert: true }
    );

    res.json({ message: 'Profile updated successfully', creator });
  } catch (error) {
    console.error('updateProfile full error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/creators/:id  (public)
const getPublicProfile = async (req, res) => {
  try {
    const creator = await Creator.findById(req.params.id).select('-instagram.accessToken');
    if (!creator) {
      return res.status(404).json({ message: 'Creator not found' });
    }
    res.json({ creator });
  } catch (error) {
    console.error('getPublicProfile error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/creators/search  (public - brands search creators)
const searchCreators = async (req, res) => {
  try {
    const {
      category,
      city,
      minFollowers,
      maxFollowers,
      minEngagement,
      barterEnabled,
      isOpenForCollab,
      sortBy,
      page = 1,
      limit = 12,
    } = req.query;

    const query = {};

    if (category) query.categories = { $in: [category] };
    if (city) query['location.city'] = { $regex: city, $options: 'i' };
    if (minFollowers || maxFollowers) {
      query['instagram.followersCount'] = {};
      if (minFollowers) query['instagram.followersCount'].$gte = Number(minFollowers);
      if (maxFollowers) query['instagram.followersCount'].$lte = Number(maxFollowers);
    }
    if (minEngagement) query['instagram.engagementRate'] = { $gte: Number(minEngagement) };
    if (barterEnabled === 'true') query.barterEnabled = true;
    if (isOpenForCollab === 'true') query.isOpenForCollab = true;

    const sortOptions = {
      followers: { 'instagram.followersCount': -1 },
      engagement: { 'instagram.engagementRate': -1 },
      newest: { createdAt: -1 },
    };
    const sort = sortOptions[sortBy] || sortOptions.newest;

    const skip = (Number(page) - 1) * Number(limit);

    const [creators, total] = await Promise.all([
      Creator.find(query)
        .select('-instagram.accessToken')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Creator.countDocuments(query),
    ]);

    res.json({
      creators,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('searchCreators error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getMyProfile,
  createProfile,
  updateProfile,
  getPublicProfile,
  searchCreators,
};