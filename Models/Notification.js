const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: [
      'booking_request', 'booking_approved', 'booking_rejected',
      'booking_cancelled', 'booking_completed',
      'payment_received', 'payment_failed', 'refund_processed',
      'checkin_reminder', 'checkout_reminder',
      'hostel_approved', 'hostel_rejected',
      'new_registration', 'hostel_pending',
      'system', 'platform_alert',
    ],
    default: 'system',
  },
  read: { type: Boolean, default: false },
  // Optional references for deep-linking
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  hostel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', default: null },
}, { timestamps: true });

NotificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
