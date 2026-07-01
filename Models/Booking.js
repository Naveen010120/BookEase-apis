const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changedByRole: { type: String },
  note: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const BookingSchema = new mongoose.Schema({
  bookingId: { type: String, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hostel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  guestName: { type: String, required: true },
  guestPhone: { type: String, required: true },
  emergencyContact: { type: String, default: '' },
  totalAmount: { type: Number, required: true },
  bookingStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded'],
    default: 'unpaid',
  },
  paymentId: { type: String, default: '' },
  statusHistory: [statusHistorySchema],
  rejectionReason: { type: String, default: '' },
  cancellationReason: { type: String, default: '' },
}, { timestamps: true });

BookingSchema.pre('save', function (next) {
  if (!this.bookingId) {
    this.bookingId = 'BK' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
  next();
});

BookingSchema.index({ user: 1, createdAt: -1 });
BookingSchema.index({ hostel: 1, bookingStatus: 1 });
BookingSchema.index({ bookingId: 1 });

module.exports = mongoose.model('Booking', BookingSchema);
