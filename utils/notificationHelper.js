const Notification = require('../Models/Notification');

/**
 * Create a notification for one or more users.
 * @param {Object|Object[]} payload - Single or array of notification objects
 */
const createNotification = async (payload) => {
  try {
    if (Array.isArray(payload)) {
      await Notification.insertMany(payload);
    } else {
      await Notification.create(payload);
    }
  } catch (err) {
    // Notifications are non-critical — log but don't throw
    console.error('Notification creation failed:', err.message);
  }
};

module.exports = { createNotification };
