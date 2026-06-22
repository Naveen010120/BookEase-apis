const router = require('express').Router();
const { addReview, getHostelReviews, toggleLike, deleteReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

router.post('/hostel/:hostelId', protect, addReview);
router.get('/hostel/:hostelId', getHostelReviews);
router.put('/:reviewId/like', protect, toggleLike);
router.delete('/:reviewId', protect, deleteReview);

module.exports = router;
