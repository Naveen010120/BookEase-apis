const router = require('express').Router();
const {
  createBooking, getUserBookings, getBookingById, cancelBooking,
  getHostelBookings, updateBookingStatus,
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, createBooking);
router.get('/my-bookings', protect, getUserBookings);
router.get('/:id', protect, getBookingById);
router.put('/:id/cancel', protect, cancelBooking);
router.get('/hostel/:hostelId', protect, authorize('owner', 'admin'), getHostelBookings);
router.put('/:id/status', protect, authorize('owner', 'admin'), updateBookingStatus);

module.exports = router;
