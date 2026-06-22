const mongoose = require('mongoose');

const HostelSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hostelName: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, default: 'India' },
  coordinates: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
  },
  images: [{ type: String }],
  amenities: [{ type: String }],
  rules: [{ type: String }],
  gender: { type: String, enum: ['male', 'female', 'co-ed'], required: true },
  nearbyUniversities: [{ type: String }],
  contactPhone: { type: String, default: '' },
  contactEmail: { type: String, default: '' },
  isApproved: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  startingPrice: { type: Number, default: 0 },
}, { timestamps: true });

HostelSchema.index({ city: 1, gender: 1 });
HostelSchema.index({ hostelName: 'text', city: 'text' });

module.exports = mongoose.model('Hostel', HostelSchema);
