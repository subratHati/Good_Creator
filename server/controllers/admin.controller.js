const Creator = require('../models/Creator');
const Brand = require('../models/Brand');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendAdminEmail } = require('../services/email.service');

// GET /api/admin/creators
// Returns all creators with their linked User account info (email, isActive,
// isEmailVerified) merged in, since the admin needs both profile details
// and account status in one view.
const getAllCreators = async (req, res) => {
  try {
    const { instagramStatus } = req.query;

    const query = {};
    if (instagramStatus === 'connected') {
      query['instagram.isConnected'] = true;
    } else if (instagramStatus === 'manual') {
      query['instagram.isManuallyAdded'] = true;
    } else if (instagramStatus === 'none') {
      query['instagram.isConnected'] = false;
      query['instagram.isManuallyAdded'] = false;
    }

    const creators = await Creator.find(query)
      .select('-instagram.accessToken')
      .populate('userId', 'email isActive isEmailVerified createdAt')
      .sort({ createdAt: -1 });

    res.json({ creators, total: creators.length });
  } catch (error) {
    console.error('getAllCreators error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/admin/brands
const getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find()
      .select('-instagram.accessToken')
      .populate('userId', 'email isActive isEmailVerified createdAt')
      .sort({ createdAt: -1 });

    res.json({ brands, total: brands.length });
  } catch (error) {
    console.error('getAllBrands error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/admin/send-message
// body: { userIds: [ObjectId, ...], channels: ['email', 'inApp'], subject, message, actionPath }
// Sends to one or many users. Each recipient is handled independently —
// one failed email should not stop the rest of the batch from sending.
const sendMessage = async (req, res) => {
  try {
    const { userIds, channels, subject, message, actionPath } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'At least one recipient is required' });
    }
    if (!Array.isArray(channels) || channels.length === 0) {
      return res.status(400).json({ message: 'At least one channel (email or inApp) is required' });
    }
    if (!subject || !subject.trim()) {
      return res.status(400).json({ message: 'Subject is required' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const sendEmail = channels.includes('email');
    const sendInApp = channels.includes('inApp');

    const users = await User.find({ _id: { $in: userIds } }).select('email');

    const results = {
      total: users.length,
      emailSent: 0,
      emailFailed: 0,
      inAppCreated: 0,
    };

    // process each recipient independently — Promise.allSettled so one
    // failure (e.g. a bounced email) doesn't abort the whole batch
    await Promise.allSettled(
      users.map(async (user) => {
        if (sendEmail) {
          try {
            await sendAdminEmail(user.email, subject.trim(), message.trim());
            results.emailSent += 1;
          } catch (err) {
            console.error(`[ADMIN MESSAGE] Email failed for ${user.email}:`, err.message);
            results.emailFailed += 1;
          }
        }

        if (sendInApp) {
          await Notification.create({
            userId: user._id,
            title: subject.trim(),
            message: message.trim(),
            actionPath: actionPath || '/',
            sentBy: req.user.id,
          });
          results.inAppCreated += 1;
        }
      })
    );

    res.json({ message: 'Messages processed', results });
  } catch (error) {
    console.error('sendMessage error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/admin/referral-stats
const getReferralStats = async (req, res) => {
  try {
    const results = await User.aggregate([
      { $match: { referralSource: { $ne: '' } } },
      { $group: { _id: '$referralSource', count: { $sum: 1 } } },
    ]);

    const counts = { instagram: 0, friend_referral: 0, google_search: 0, whatsapp: 0, other: 0 };
    results.forEach((r) => {
      if (counts[r._id] !== undefined) counts[r._id] = r.count;
    });

    res.json({ counts });
  } catch (error) {
    console.error('getReferralStats error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAllCreators, getAllBrands, sendMessage, getReferralStats };
