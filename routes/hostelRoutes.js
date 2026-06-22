const router = require('express').Router();
const {
  getHostels, getHostelById, createHostel, updateHostel, deleteHostel,
  getOwnerHostels, addRoom, updateRoom, deleteRoom,
} = require('../controllers/hostelController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getHostels);
router.get('/my-hostels', protect, authorize('owner', 'admin'), getOwnerHostels);
router.get('/:id', getHostelById);
router.post('/', protect, authorize('owner', 'admin'), createHostel);
router.put('/:id', protect, authorize('owner', 'admin'), updateHostel);
router.delete('/:id', protect, authorize('owner', 'admin'), deleteHostel);

// Room sub-routes
router.post('/:id/rooms', protect, authorize('owner', 'admin'), addRoom);
router.put('/:id/rooms/:roomId', protect, authorize('owner', 'admin'), updateRoom);
router.delete('/:id/rooms/:roomId', protect, authorize('owner', 'admin'), deleteRoom);

module.exports = router;
