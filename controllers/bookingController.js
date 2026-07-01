const Booking = require('../Models/Booking');
const Room = require('../Models/Room');
const Hostel = require('../Models/Hostel');
const { createNotification } = require('../utils/notificationHelper');

// ─── User: Create Booking ────────────────────────────────────────────────────
exports.createBooking = async (req, res, next) => {
  try {
    const { hostelId, roomId, checkIn, checkOut, guestName, guestPhone, emergencyContact } = req.body;

    if (!hostelId || !roomId || !checkIn || !checkOut || !guestName || !guestPhone) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    const [room, hostel] = await Promise.all([
      Room.findById(roomId),
      Hostel.findById(hostelId).select('owner hostelName isApproved isActive'),
    ]);

    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (!hostel) return res.status(404).json({ error: 'Hostel not found' });
    if (!hostel.isApproved || !hostel.isActive) return res.status(400).json({ error: 'Hostel is not available for booking' });
    if (room.availableBeds < 1) return res.status(400).json({ error: 'No beds available in this room' });

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (checkOutDate <= checkInDate) return res.status(400).json({ error: 'Check-out must be after check-in' });

    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const totalAmount = Math.ceil((room.monthlyPrice / 30) * nights);

    const booking = await Booking.create({
      user: req.user._id,
      hostel: hostelId,
      room: roomId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guestName,
      guestPhone,
      emergencyContact: emergencyContact || '',
      totalAmount,
      bookingStatus: 'pending',
      statusHistory: [{
        status: 'pending',
        changedBy: req.user._id,
        changedByRole: 'user',
        note: 'Booking request submitted',
      }],
    });

    // Decrement available beds
    room.availableBeds -= 1;
    await room.save();

    // Notify user
    await createNotification({
      user: req.user._id,
      title: 'Booking Request Submitted',
      message: `Your booking #${booking.bookingId} at ${hostel.hostelName} is pending owner approval.`,
      type: 'booking_request',
      booking: booking._id,
      hostel: hostelId,
    });

    // Notify hostel owner
    await createNotification({
      user: hostel.owner,
      title: 'New Booking Request',
      message: `${guestName} has requested a booking (#${booking.bookingId}) at your hostel ${hostel.hostelName}.`,
      type: 'booking_request',
      booking: booking._id,
      hostel: hostelId,
    });

    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
};

// ─── User: Get My Bookings ───────────────────────────────────────────────────
exports.getUserBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { user: req.user._id };
    if (status && status !== 'all') filter.bookingStatus = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('hostel', 'hostelName city images state')
        .populate('room', 'roomType monthlyPrice sharing')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Booking.countDocuments(filter),
    ]);

    res.json({ bookings, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
};

// ─── User/Owner/Admin: Get Booking By ID ────────────────────────────────────
exports.getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('hostel', 'hostelName city state address images owner contactPhone contactEmail')
      .populate('room', 'roomType monthlyPrice sharing isAC features')
      .populate('user', 'name email phone')
      .populate('statusHistory.changedBy', 'name role');

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const isOwner = booking.hostel?.owner?.toString() === req.user._id.toString();
    const isUser = booking.user?._id?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isUser && !isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to view this booking' });
    }

    res.json(booking);
  } catch (err) {
    next(err);
  }
};

// ─── User: Cancel Booking ────────────────────────────────────────────────────
exports.cancelBooking = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id).populate('hostel', 'hostelName owner');

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (['cancelled', 'completed', 'rejected'].includes(booking.bookingStatus)) {
      return res.status(400).json({ error: `Cannot cancel a booking that is already ${booking.bookingStatus}` });
    }
    if (new Date(booking.checkIn) <= new Date()) {
      return res.status(400).json({ error: 'Cannot cancel a booking after check-in date' });
    }

    booking.bookingStatus = 'cancelled';
    booking.cancellationReason = reason || '';
    booking.statusHistory.push({
      status: 'cancelled',
      changedBy: req.user._id,
      changedByRole: 'user',
      note: reason || 'Cancelled by user',
    });
    await booking.save();

    // Restore bed
    await Room.findByIdAndUpdate(booking.room, { $inc: { availableBeds: 1 } });

    // Notify user
    await createNotification({
      user: req.user._id,
      title: 'Booking Cancelled',
      message: `Your booking #${booking.bookingId} has been cancelled.`,
      type: 'booking_cancelled',
      booking: booking._id,
      hostel: booking.hostel._id,
    });

    // Notify owner
    await createNotification({
      user: booking.hostel.owner,
      title: 'Booking Cancelled by Guest',
      message: `Booking #${booking.bookingId} at ${booking.hostel.hostelName} was cancelled by the guest.`,
      type: 'booking_cancelled',
      booking: booking._id,
      hostel: booking.hostel._id,
    });

    res.json({ message: 'Booking cancelled successfully', booking });
  } catch (err) {
    next(err);
  }
};

// ─── Owner: Get All Bookings For Owner's Hostels ─────────────────────────────
exports.getOwnerBookings = async (req, res, next) => {
  try {
    const {
      status, hostelId, search, paymentStatus,
      page = 1, limit = 20, sort = '-createdAt',
    } = req.query;

    // Get all hostels owned by this user
    const ownerHostels = await Hostel.find({ owner: req.user._id }).select('_id hostelName');
    const hostelIds = ownerHostels.map((h) => h._id);

    if (!hostelIds.length) {
      return res.json({ bookings: [], total: 0, page: 1, pages: 0, hostels: [] });
    }

    const filter = { hostel: { $in: hostelIds } };
    if (status && status !== 'all') filter.bookingStatus = status;
    if (hostelId) filter.hostel = hostelId;
    if (paymentStatus && paymentStatus !== 'all') filter.paymentStatus = paymentStatus;

    let query = Booking.find(filter)
      .populate('user', 'name email phone')
      .populate('hostel', 'hostelName city')
      .populate('room', 'roomType sharing monthlyPrice')
      .sort(sort);

    // Text search across guestName, bookingId
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { guestName: regex },
        { bookingId: regex },
        { guestPhone: regex },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('user', 'name email phone')
        .populate('hostel', 'hostelName city')
        .populate('room', 'roomType sharing monthlyPrice')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Booking.countDocuments(filter),
    ]);

    res.json({
      bookings,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      hostels: ownerHostels,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Owner: Get Bookings For A Specific Hostel ───────────────────────────────
exports.getHostelBookings = async (req, res, next) => {
  try {
    const hostel = await Hostel.findById(req.params.hostelId);
    if (!hostel) return res.status(404).json({ error: 'Hostel not found' });
    if (hostel.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized — you do not own this hostel' });
    }

    const bookings = await Booking.find({ hostel: req.params.hostelId })
      .populate('user', 'name email phone')
      .populate('room', 'roomType sharing')
      .sort('-createdAt');

    res.json(bookings);
  } catch (err) {
    next(err);
  }
};

// ─── Owner: Update Booking Status ────────────────────────────────────────────
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;

    const VALID_STATUSES = ['approved', 'rejected', 'cancelled', 'completed'];
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Owner can set: ${VALID_STATUSES.join(', ')}` });
    }

    const booking = await Booking.findById(req.params.id)
      .populate('hostel', 'owner hostelName')
      .populate('user', 'name');

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Only the hostel owner can update status
    if (booking.hostel.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized — you do not own this hostel' });
    }

    // Business rules validation
    const current = booking.bookingStatus;
    const allowed = {
      pending: ['approved', 'rejected'],
      approved: ['cancelled', 'completed'],
      rejected: [],
      cancelled: [],
      completed: [],
    };

    if (!allowed[current]?.includes(status)) {
      return res.status(400).json({
        error: `Cannot transition from "${current}" to "${status}". Allowed: ${allowed[current]?.join(', ') || 'none'}`,
      });
    }

    // If completing, check that checkout date has passed or is today
    if (status === 'completed') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkOut = new Date(booking.checkOut);
      checkOut.setHours(0, 0, 0, 0);
      if (checkOut > today) {
        return res.status(400).json({ error: 'Cannot mark as completed before the check-out date' });
      }
    }

    const prevStatus = booking.bookingStatus;
    booking.bookingStatus = status;
    if (status === 'rejected') booking.rejectionReason = note || '';
    if (status === 'cancelled') booking.cancellationReason = note || '';

    booking.statusHistory.push({
      status,
      changedBy: req.user._id,
      changedByRole: 'owner',
      note: note || '',
    });

    await booking.save();

    // Restore bed if rejected or cancelled
    if (['rejected', 'cancelled'].includes(status)) {
      await Room.findByIdAndUpdate(booking.room, { $inc: { availableBeds: 1 } });
    }

    // Notification type map
    const typeMap = {
      approved: 'booking_approved',
      rejected: 'booking_rejected',
      cancelled: 'booking_cancelled',
      completed: 'booking_completed',
    };

    const messageMap = {
      approved: `Your booking #${booking.bookingId} at ${booking.hostel.hostelName} has been approved!`,
      rejected: `Your booking #${booking.bookingId} at ${booking.hostel.hostelName} was rejected.${note ? ` Reason: ${note}` : ''}`,
      cancelled: `Your booking #${booking.bookingId} at ${booking.hostel.hostelName} was cancelled by the owner.${note ? ` Reason: ${note}` : ''}`,
      completed: `Your stay at ${booking.hostel.hostelName} (Booking #${booking.bookingId}) has been marked as completed.`,
    };

    const titleMap = {
      approved: 'Booking Approved ✅',
      rejected: 'Booking Rejected',
      cancelled: 'Booking Cancelled',
      completed: 'Stay Completed 🎉',
    };

    await createNotification({
      user: booking.user._id,
      title: titleMap[status],
      message: messageMap[status],
      type: typeMap[status],
      booking: booking._id,
      hostel: booking.hostel._id,
    });

    res.json({ message: `Booking ${status} successfully`, booking });
  } catch (err) {
    next(err);
  }
};
