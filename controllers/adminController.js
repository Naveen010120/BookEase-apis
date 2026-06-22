const User = require('../Models/User');
const Hostel = require('../Models/Hostel');
const Booking = require('../Models/Booking');
const Review = require('../Models/Review');

exports.getDashboard = async (req, res, next) => {
  try {
    const [users, hostels, bookings, reviews] = await Promise.all([
      User.countDocuments(),
      Hostel.countDocuments(),
      Booking.countDocuments(),
      Review.countDocuments(),
    ]);
    res.json({ users, hostels, bookings, reviews });
  } catch (err) {
    next(err);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort('-createdAt');
    res.json(users);
  } catch (err) {
    next(err);
  }
};

exports.blockUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isVerified: false }, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.approveHostel = async (req, res, next) => {
  try {
    const hostel = await Hostel.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    if (!hostel) return res.status(404).json({ error: 'Hostel not found' });
    res.json(hostel);
  } catch (err) {
    next(err);
  }
};

exports.getPendingHostels = async (req, res, next) => {
  try {
    const hostels = await Hostel.find({ isApproved: false }).populate('owner', 'name email');
    res.json(hostels);
  } catch (err) {
    next(err);
  }
};

exports.getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'name email')
      .populate('hostel', 'hostelName city')
      .sort('-createdAt');
    res.json(bookings);
  } catch (err) {
    next(err);
  }
};
