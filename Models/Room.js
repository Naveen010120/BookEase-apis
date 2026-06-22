const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  hostel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
  roomType: { type: String, enum: ['single', 'double', 'triple', 'dormitory'], required: true },
  sharing: { type: Number, required: true },
  totalBeds: { type: Number, required: true },
  availableBeds: { type: Number, required: true },
  monthlyPrice: { type: Number, required: true },
  images: [{ type: String }],
  features: [{ type: String }],
  isAC: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Room', RoomSchema);
