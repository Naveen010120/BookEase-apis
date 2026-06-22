const router = require('express').Router();
const {
  getDashboard, getAllUsers, blockUser, approveHostel, getPendingHostels, getAllBookings,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboard);
router.get('/users', getAllUsers);
router.put('/users/:id/block', blockUser);
router.get('/hostels/pending', getPendingHostels);
router.put('/hostels/approve/:id', approveHostel);
router.get('/bookings', getAllBookings);

module.exports = router;
