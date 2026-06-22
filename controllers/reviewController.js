const Review = require('../Models/Review');
const Hostel = require('../Models/Hostel');

exports.addReview = async (req, res, next) => {
  try {
    const { rating, comment, images } = req.body;
    const existing = await Review.findOne({ user: req.user._id, hostel: req.params.hostelId });
    if (existing) return res.status(409).json({ error: 'Already reviewed this hostel' });

    const review = await Review.create({
      user: req.user._id,
      hostel: req.params.hostelId,
      rating,
      comment,
      images: images || [],
    });

    // Update hostel average rating
    const reviews = await Review.find({ hostel: req.params.hostelId });
    const avg = reviews.reduce((a, r) => a + r.rating, 0) / reviews.length;
    await Hostel.findByIdAndUpdate(req.params.hostelId, {
      averageRating: Math.round(avg * 10) / 10,
      totalReviews: reviews.length,
    });

    await review.populate('user', 'name avatar');
    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
};

exports.getHostelReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ hostel: req.params.hostelId })
      .populate('user', 'name avatar')
      .sort('-createdAt');
    res.json(reviews);
  } catch (err) {
    next(err);
  }
};

exports.toggleLike = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    const idx = review.likes.indexOf(req.user._id);
    if (idx === -1) review.likes.push(req.user._id);
    else review.likes.splice(idx, 1);
    await review.save();
    res.json({ likes: review.likes.length });
  } catch (err) {
    next(err);
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Not authorized' });
    await review.deleteOne();
    res.json({ message: 'Review deleted' });
  } catch (err) {
    next(err);
  }
};
