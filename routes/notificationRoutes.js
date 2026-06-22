const router = require('express').Router();
const Notification = require('../Models/Notification');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort('-createdAt').limit(20);
    res.json(notifications);
  } catch (err) { next(err); }
});

router.put('/mark-read', protect, async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ message: 'All marked as read' });
  } catch (err) { next(err); }
});

router.put('/:id/read', protect, async (req, res, next) => {
  try {
    const n = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    res.json(n);
  } catch (err) { next(err); }
});

module.exports = router;
