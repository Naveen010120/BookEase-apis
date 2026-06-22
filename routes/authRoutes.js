const router = require('express').Router();
const {
  register, login, logout, getProfile, updateProfile, toggleSaveHostel,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/saved-hostels/:hostelId', protect, toggleSaveHostel);

module.exports = router;
