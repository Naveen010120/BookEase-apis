const User = require('../Models/User');
const Hostel = require('../Models/Hostel');
const Booking = require('../Models/Booking');
const Review = require('../Models/Review');
const { createNotification } = require('../utils/notificationHelper');

exports.getDashboard = async (req, res, next) => {
  try {
    const [users, hostels, bookings, reviews, pendingHostels, recentBookings] = await Promise.all([
      User.countDocuments(),
      Hostel.countDocuments({ isApproved: true }),
      Booking.countDocuments(),
      Review.countDocuments(),
      Hostel.countDocuments({ isApproved: false }),
      Booking.find().sort('-createdAt').limit(5)
        .populate('user', 'name email')
        .populate('hostel', 'hostelName city'),
    ]);

    const revenue = await Booking.aggregate([
      { $match: { bookingStatus: { $in: ['approved', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    res.json({
      users,
      hostels,
      bookings,
      reviews,
      pendingHostels,
      totalRevenue: revenue[0]?.total || 0,
      recentBookings,
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const { search, role, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (role && role !== 'all') filter.role = role;
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort('-createdAt').skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.json({ users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
};

exports.blockUser = async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.role === 'admin') return res.status(403).json({ error: 'Cannot block an admin' });

    target.isVerified = !target.isVerified;
    await target.save();

    res.json({ message: `User ${target.isVerified ? 'unblocked' : 'blocked'} successfully`, user: target });
  } catch (err) {
    next(err);
  }
};

exports.getPendingHostels = async (req, res, next) => {
  try {
    const hostels = await Hostel.find({ isApproved: false })
      .populate('owner', 'name email phone')
      .sort('-createdAt');
    res.json(hostels);
  } catch (err) {
    next(err);
  }
};

exports.approveHostel = async (req, res, next) => {
  try {
    const hostel = await Hostel.findById(req.params.id).populate('owner', '_id name');
    if (!hostel) return res.status(404).json({ error: 'Hostel not found' });

    hostel.isApproved = true;
    await hostel.save();

    await createNotification({
      user: hostel.owner._id,
      title: 'Hostel Approved ✅',
      message: `Your hostel "${hostel.hostelName}" has been approved and is now live on the platform.`,
      type: 'hostel_approved',
      hostel: hostel._id,
    });

    res.json({ message: 'Hostel approved successfully', hostel });
  } catch (err) {
    next(err);
  }
};

exports.rejectHostel = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const hostel = await Hostel.findById(req.params.id).populate('owner', '_id name');
    if (!hostel) return res.status(404).json({ error: 'Hostel not found' });

    hostel.isApproved = false;
    hostel.isActive = false;
    await hostel.save();

    await createNotification({
      user: hostel.owner._id,
      title: 'Hostel Rejected',
      message: `Your hostel "${hostel.hostelName}" was not approved.${reason ? ` Reason: ${reason}` : ' Please review and resubmit.'}`,
      type: 'hostel_rejected',
      hostel: hostel._id,
    });

    res.json({ message: 'Hostel rejected', hostel });
  } catch (err) {
    next(err);
  }
};

exports.getAllHostels = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status === 'approved') filter.isApproved = true;
    if (status === 'pending') filter.isApproved = false;
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ hostelName: regex }, { city: regex }];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [hostels, total] = await Promise.all([
      Hostel.find(filter).populate('owner', 'name email').sort('-createdAt').skip(skip).limit(Number(limit)),
      Hostel.countDocuments(filter),
    ]);

    res.json({ hostels, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
};

// READ-ONLY — Admin cannot change booking status
exports.getAllBookings = async (req, res, next) => {
  try {
    const { search, status, paymentStatus, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.bookingStatus = status;
    if (paymentStatus && paymentStatus !== 'all') filter.paymentStatus = paymentStatus;
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ guestName: regex }, { bookingId: regex }];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('user', 'name email')
        .populate('hostel', 'hostelName city')
        .populate('room', 'roomType sharing')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Booking.countDocuments(filter),
    ]);

    res.json({ bookings, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
};
