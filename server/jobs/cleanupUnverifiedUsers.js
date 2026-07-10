// server/jobs/cleanupUnverifiedUsers.js
// Deletes unverified accounts older than 24 hours
// Add this to server.js: require('./jobs/cleanupUnverifiedUsers')();

const User = require('../models/User');

const cleanupUnverifiedUsers = () => {
  const run = async () => {
    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      const result = await User.deleteMany({
        isEmailVerified: false,
        createdAt: { $lt: cutoff },
      });
      if (result.deletedCount > 0) {
        console.log(`[CLEANUP] Deleted ${result.deletedCount} unverified account(s)`);
      }
    } catch (err) {
      console.error('[CLEANUP] Error:', err.message);
    }
  };


  // run in every 6 hours
  setInterval(run, 6 * 60 * 60 * 1000);
};

module.exports = cleanupUnverifiedUsers;
