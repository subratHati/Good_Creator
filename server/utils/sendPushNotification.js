// utils/sendPushNotification.js
const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const sendPushNotification = async (userId, { title, body, url = '/' }) => {
  try {
    const subscriptions = await PushSubscription.find({ userId });
    if (subscriptions.length === 0) return { sent: 0, failed: 0 };

    const payload = JSON.stringify({ title, body, url });

    let sent = 0;
    let failed = 0;

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
            },
            payload
          );
          sent += 1;
        } catch (err) {
          failed += 1;
          if (err.statusCode === 410 || err.statusCode === 404) {
            await PushSubscription.deleteOne({ _id: sub._id }).catch(() => {});
          } else {
            console.error('sendPushNotification error:', err.message);
          }
        }
      })
    );

    return { sent, failed };
  } catch (error) {
    console.error('sendPushNotification outer error:', error.message);
    return { sent: 0, failed: 0 };
  }
};

const sendPushNotificationBatch = async (userIds, payload, { batchSize = 50, delayMs = 200 } = {}) => {
  let totalSent = 0;
  let totalFailed = 0;

  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);

    const results = await Promise.all(
      batch.map((userId) => sendPushNotification(userId, payload))
    );

    results.forEach((r) => {
      totalSent += r.sent;
      totalFailed += r.failed;
    });

    if (i + batchSize < userIds.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return { totalSent, totalFailed };
};

module.exports = sendPushNotification;
module.exports.sendPushNotificationBatch = sendPushNotificationBatch;
