const Creator = require('../models/Creator');
const Review = require('../models/Review');
const Brand = require('../models/Brand');
const buildCreatorRankingPipeline = require('../utils/buildCreatorRankingPipeline');
const calculateQualityScore = require('../utils/calculateQualityScore');

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
// PUT /api/creators/profile
const updateProfile = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
      updateData.profilePhoto = req.file.path;
    }
    let creator = await Creator.findOneAndUpdate(
      { userId: req.user.id },
      { $set: updateData },
      { new: true, runValidators: true, upsert: true }
    );

    // recalculate quality score now that profile data may have changed
    // (bio, photo, categories, location, pricing all feed into it)
    const newScore = await calculateQualityScore(creator);
    creator = await Creator.findByIdAndUpdate(
      creator._id,
      { qualityScore: newScore },
      { new: true }
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
      search,
      page = 1,
      limit = 12,
    } = req.query;

    const query = {};
    if (category) query.categories = { $in: [category] };

    // text search — matches creator name, category, or Instagram handle
    // (only meaningful for creators who've actually connected/added Instagram)
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [
        { name: searchRegex },
        { categories: searchRegex },
        { 'instagram.handle': searchRegex },
      ];
    }
    if (city) query['location.city'] = { $regex: city, $options: 'i' };
    if (minFollowers || maxFollowers) {
      query['instagram.followersCount'] = {};
      if (minFollowers) query['instagram.followersCount'].$gte = Number(minFollowers);
      if (maxFollowers) query['instagram.followersCount'].$lte = Number(maxFollowers);
    }
    if (minEngagement) query['instagram.engagementRate'] = { $gte: Number(minEngagement) };
    if (barterEnabled === 'true') query.barterEnabled = true;
    if (isOpenForCollab === 'true') query.isOpenForCollab = true;

    const skip = (Number(page) - 1) * Number(limit);

    // manual sortBy (followers/engagement) still works exactly as before —
    // this is a brand's explicit override, separate from the tiered
    // ranking that's now the default experience
    if (sortBy === 'followers' || sortBy === 'engagement') {
      const sortOptions = {
        followers: { 'instagram.followersCount': -1 },
        engagement: { 'instagram.engagementRate': -1 },
      };
      const [creators, total] = await Promise.all([
        Creator.find(query)
          .select('-instagram.accessToken')
          .sort(sortOptions[sortBy])
          .skip(skip)
          .limit(Number(limit)),
        Creator.countDocuments(query),
      ]);
      return res.json({
        creators,
        pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
      });
    }

    // default: tiered ranking (quality tier + category/location match + rotation)
    let brandCategory = null;
    let brandCity = null;
    let brandState = null;
    if (req.user?.role === 'brand') {
      const brand = await Brand.findOne({ userId: req.user.id }).select('category location');
      if (brand) {
        brandCategory = brand.category || null;
        brandCity = brand.location?.city || null;
        brandState = brand.location?.state || null;
      }
    }

    const pipeline = buildCreatorRankingPipeline({
      matchQuery: query,
      brandCategory,
      brandCity,
      brandState,
      skip,
      limit: Number(limit),
    });

    const [creators, total] = await Promise.all([
      Creator.aggregate(pipeline),
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

// ─── GET /api/creators/:id/reviews ────────────────────────────────────────────
// Fetches reviews for one specific creator. Deliberately a separate,
// on-demand endpoint — not bundled into getPublicProfile/getMyProfile —
// so pages that don't need reviews (BrowseCreators, CreatorHome, etc.)
// never pay the cost of fetching them.
const getCreatorReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ creatorId: req.params.id })
      .sort({ createdAt: -1 })
      .select('brandName rating reviewText createdAt');

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

    res.json({ reviews, avgRating, count: reviews.length });
  } catch (error) {
    console.error('getCreatorReviews error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getMyProfile,
  createProfile,
  updateProfile,
  getPublicProfile,
  searchCreators,
  getCreatorReviews,
};
