const router = require('express').Router();
const { upload, uploadImages, uploadByLink } = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');

router.post('/upload', protect, upload.array('photos', 20), uploadImages);
router.post('/upload-by-link', protect, uploadByLink);

module.exports = router;
