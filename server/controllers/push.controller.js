// controllers/push.controller.js
const PushSubscription = require('../models/PushSubscription');

const subscribe = async (req, res) => {
  const { subscription } = req.body;
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return res.status(400).json({ message: 'Invalid subscription payload' });
  }

  try {
    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        userId: req.user.id,
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
        userAgent: req.headers['user-agent'] || '',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ message: 'Subscribed to push notifications' });
  } catch (error) {
    console.error('push subscribe error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const unsubscribe = async (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) return res.status(400).json({ message: 'endpoint is required' });

  try {
    await PushSubscription.deleteOne({ endpoint, userId: req.user.id });
    res.json({ message: 'Unsubscribed' });
  } catch (error) {
    console.error('push unsubscribe error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  subscribe,
  unsubscribe,
};
