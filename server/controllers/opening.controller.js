const Opening = require('../models/Opening');
const Brand = require('../models/Brand');
const Creator = require('../models/Creator');
const sendPushNotification = require('../utils/sendPushNotification');
const { sendPushNotificationBatch } = require('../utils/sendPushNotification');

// Pushes a "new campaign" notification to every creator whose
// categories overlap with this campaign's preferred niches, or whose
// city matches the brand's — no cap on who's notified, but sent in
// small paced batches (via sendPushNotificationBatch) so a large
// matching group never fires thousands of simultaneous requests at once.
const notifyMatchingCreators = async (opening, brand) => {
  const categoryList = opening.requirements?.categories || [];
  const city = brand.location?.city;

  const orConditions = [];
  if (categoryList.length > 0) {
    orConditions.push({ categories: { $in: categoryList } });
  }
  if (city) {
    orConditions.push({ 'location.city': { $regex: `^${city}$`, $options: 'i' } });
  }
  if (orConditions.length === 0) return; // nothing to match on

  const matchingCreators = await Creator.find({ $or: orConditions }).select('userId');
  const userIds = matchingCreators.map((c) => c.userId.toString());
  if (userIds.length === 0) return;

  await sendPushNotificationBatch(userIds, {
    title: 'New campaign for you',
    body: `${brand.brandName || 'A brand'} posted "${opening.title || 'a new campaign'}"`,
    url: `/openings/${opening._id}`,
  });
};

// POST /api/openings
const createOpening = async (req, res) => {
  try {
    const brand = await Brand.findOne({ userId: req.user.id });
    if (!brand) {
      return res.status(404).json({ message: 'Brand profile not found. Create your brand profile first.' });
    }

    const opening = await Opening.create({
      brandId: brand._id,
      ...req.body,
    });
    res.status(201).json({ message: 'Opening created successfully', opening });

    // notify creators whose categories or city match this new campaign —
    // not awaited, so this never delays the create-campaign response.
    // Only active/live campaigns should trigger this, matching the same
    // status the public search already filters on.
    if (opening.status === 'active') {
      notifyMatchingCreators(opening, brand).catch((err) =>
        console.error('notifyMatchingCreators error:', err.message)
      );
    }
  } catch (error) {
    console.error('createOpening error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/openings/my
const getMyOpenings = async (req, res) => {
  try {
    const brand = await Brand.findOne({ userId: req.user.id });
    if (!brand) {
      return res.status(404).json({ message: 'Brand profile not found' });
    }

    const openings = await Opening.find({ brandId: brand._id })
      .sort({ createdAt: -1 });

    res.json({ openings });
  } catch (error) {
    console.error('getMyOpenings error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/openings/:id
const updateOpening = async (req, res) => {
  try {
    const brand = await Brand.findOne({ userId: req.user.id });
    const opening = await Opening.findOne({
      _id: req.params.id,
      brandId: brand._id,
    });

    if (!opening) {
      return res.status(404).json({ message: 'Opening not found' });
    }

    const updated = await Opening.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json({ message: 'Opening updated', opening: updated });
  } catch (error) {
    console.error('updateOpening error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/openings/:id (soft delete)
const deleteOpening = async (req, res) => {
  try {
    const brand = await Brand.findOne({ userId: req.user.id });
    const opening = await Opening.findOne({
      _id: req.params.id,
      brandId: brand._id,
    });

    if (!opening) {
      return res.status(404).json({ message: 'Opening not found' });
    }

    await Opening.findByIdAndUpdate(req.params.id, { status: 'closed' });
    res.json({ message: 'Opening closed successfully' });
  } catch (error) {
    console.error('deleteOpening error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/openings/search (public — creators search)
const searchOpenings = async (req, res) => {
  try {
    const {
      contentType,
      isBarter,
      minBudget,
      maxBudget,
      categories,
      city,
      brandId,
      search,
      page = 1,
      limit = 12,
    } = req.query;

    const query = { status: 'active' };

    if (brandId) query.brandId = brandId;

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };

      // "brand name" and "category" both live on the Brand document, not on
      // Opening itself — find matching brands first, then combine with a
      // direct search on Opening's own fields (title, description,
      // requirements.categories)
      const matchingBrands = await Brand.find({
        $or: [{ brandName: searchRegex }, { category: searchRegex }],
      }).select('_id');
      const matchingBrandIds = matchingBrands.map(b => b._id);

      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { 'requirements.categories': searchRegex },
        { brandId: { $in: matchingBrandIds } },
      ];
    }

    if (contentType) query.contentType = contentType;
    if (isBarter === 'true') query.isBarter = true;
    if (minBudget || maxBudget) {
      query.budgetMax = {};
      if (minBudget) query.budgetMax.$gte = Number(minBudget);
      if (maxBudget) query.budgetMax.$lte = Number(maxBudget);
    }

    // filter by brand category matching creator categories
    if (categories) {
      const categoryList = categories.split(',').map(c => c.trim().toLowerCase()).filter(Boolean);
      if (categoryList.length > 0) {
        query['requirements.categories'] = { $in: categoryList };
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [openings, total] = await Promise.all([
      Opening.find(query)
        .populate('brandId', 'brandName logo category location instagram.handle instagram.followersCount')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Opening.countDocuments(query),
    ]);

    // if category filter returned too few results, backfill with recent openings

    // let finalOpenings = openings;
    // if (categories && openings.length < Number(limit)) {
    //   const existingIds = openings.map(o => o._id.toString());
    //   const backfill = await Opening.find({
    //     status: 'active',
    //     _id: { $nin: existingIds },
    //   })
    //     .populate('brandId', 'brandName logo category location instagram.handle instagram.followersCount')
    //     .sort({ createdAt: -1 })
    //     .limit(Number(limit) - openings.length);
    //   finalOpenings = [...openings, ...backfill];
    // }

    res.json({
      openings,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('searchOpenings error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/openings/:id (public)
const getOpeningById = async (req, res) => {
  try {
    const opening = await Opening.findById(req.params.id)
      .populate('brandId', 'brandName logo category location');

    if (!opening) {
      return res.status(404).json({ message: 'Opening not found' });
    }

    res.json({ opening });
  } catch (error) {
    console.error('getOpeningById error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createOpening,
  getMyOpenings,
  updateOpening,
  deleteOpening,
  searchOpenings,
  getOpeningById,
};
