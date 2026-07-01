const router = require('express').Router();
const {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  getOwnerBookings,
  getHostelBookings,
  updateBookingStatus,
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

// User routes
router.post('/', protect, authorize('user'), createBooking);
router.get('/my-bookings', protect, getUserBookings);

// Owner routes — must come before /:id to avoid route conflicts
router.get('/owner/all', protect, authorize('owner'), getOwnerBookings);
router.get('/hostel/:hostelId', protect, authorize('owner'), getHostelBookings);

// Shared (user sees own, owner sees their hostel's, admin read-only)
router.get('/:id', protect, getBookingById);

// User cancel
router.put('/:id/cancel', protect, authorize('user'), cancelBooking);

// Owner-only status update (approve / reject / cancel / complete)
router.put('/:id/status', protect, authorize('owner'), updateBookingStatus);

module.exports = router;
