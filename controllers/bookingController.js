const Booking = require('../Models/Booking');
const Room = require('../Models/Room');
const Notification = require('../Models/Notification');

exports.createBooking = async (req, res, next) => {
  try {
    const { hostelId, roomId, checkIn, checkOut, guestName, guestPhone, emergencyContact } = req.body;

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.availableBeds < 1) return res.status(400).json({ error: 'No beds available' });

    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    const totalAmount = Math.ceil((room.monthlyPrice / 30) * nights);

    const booking = await Booking.create({
      user: req.user._id,
      hostel: hostelId,
      room: roomId,
      checkIn,
      checkOut,
      guestName,
      guestPhone,
      emergencyContact,
      totalAmount,
    });

    // Decrement available beds
    room.availableBeds -= 1;
    await room.save();

    // Create notification
    await Notification.create({
      user: req.user._id,
      hostel: hostelId,
      title: 'Booking Confirmed',
      message: `Your booking #${booking.bookingId} has been created.`,
      type: 'booking',
    });

    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
};

exports.getUserBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('hostel', 'hostelName city images')
      .populate('room', 'roomType monthlyPrice')
      .sort('-createdAt');
    res.json(bookings);
  } catch (err) {
    next(err);
  }
};

exports.getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('hostel')
      .populate('room');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Not authorized' });
    res.json(booking);
  } catch (err) {
    next(err);
  }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not authorized' });
    if (booking.bookingStatus === 'cancelled')
      return res.status(400).json({ error: 'Already cancelled' });

    booking.bookingStatus = 'cancelled';
    await booking.save();

    // Restore bed
    await Room.findByIdAndUpdate(booking.room, { $inc: { availableBeds: 1 } });

    res.json({ message: 'Booking cancelled', booking });
  } catch (err) {
    next(err);
  }
};

// Owner: get bookings for their hostels
exports.getHostelBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ hostel: req.params.hostelId })
      .populate('user', 'name email phone')
      .populate('room', 'roomType')
      .sort('-createdAt');
    res.json(bookings);
  } catch (err) {
    next(err);
  }
};

exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { bookingStatus: status },
      { new: true }
    );
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    next(err);
  }
};
