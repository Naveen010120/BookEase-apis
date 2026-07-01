const router = require('express').Router();
const {
  getDashboard,
  getAllUsers,
  blockUser,
  approveHostel,
  rejectHostel,
  getPendingHostels,
  getAllHostels,
  getAllBookings,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboard);

// Users
router.get('/users', getAllUsers);
router.put('/users/:id/block', blockUser);

// Hostels
router.get('/hostels', getAllHostels);
router.get('/hostels/pending', getPendingHostels);
router.put('/hostels/approve/:id', approveHostel);
router.put('/hostels/reject/:id', rejectHostel);

// Bookings — READ ONLY
router.get('/bookings', getAllBookings);

module.exports = router;
