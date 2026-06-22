const Hostel = require('../Models/Hostel');
const Room = require('../Models/Room');

exports.getHostels = async (req, res, next) => {
  try {
    const { city, gender, minPrice, maxPrice, amenities, search, sort = '-createdAt', page = 1, limit = 12 } = req.query;
    const filter = { isApproved: true, isActive: true };

    if (city) filter.city = new RegExp(city, 'i');
    if (gender) filter.gender = gender;
    if (search) filter.$text = { $search: search };
    if (minPrice || maxPrice) {
      filter.startingPrice = {};
      if (minPrice) filter.startingPrice.$gte = Number(minPrice);
      if (maxPrice) filter.startingPrice.$lte = Number(maxPrice);
    }
    if (amenities) {
      const list = amenities.split(',');
      filter.amenities = { $all: list };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [hostels, total] = await Promise.all([
      Hostel.find(filter).sort(sort).skip(skip).limit(Number(limit)).populate('owner', 'name'),
      Hostel.countDocuments(filter),
    ]);

    res.json({ hostels, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
};

exports.getHostelById = async (req, res, next) => {
  try {
    const hostel = await Hostel.findById(req.params.id).populate('owner', 'name email phone');
    if (!hostel) return res.status(404).json({ error: 'Hostel not found' });
    const rooms = await Room.find({ hostel: req.params.id, isActive: true });
    res.json({ hostel, rooms });
  } catch (err) {
    next(err);
  }
};

exports.createHostel = async (req, res, next) => {
  try {
    const hostel = await Hostel.create({ ...req.body, owner: req.user._id });
    res.status(201).json(hostel);
  } catch (err) {
    next(err);
  }
};

exports.updateHostel = async (req, res, next) => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) return res.status(404).json({ error: 'Hostel not found' });
    if (hostel.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Not authorized' });

    const updated = await Hostel.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.deleteHostel = async (req, res, next) => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) return res.status(404).json({ error: 'Hostel not found' });
    if (hostel.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Not authorized' });
    await hostel.deleteOne();
    res.json({ message: 'Hostel deleted' });
  } catch (err) {
    next(err);
  }
};

exports.getOwnerHostels = async (req, res, next) => {
  try {
    const hostels = await Hostel.find({ owner: req.user._id }).sort('-createdAt');
    res.json(hostels);
  } catch (err) {
    next(err);
  }
};

// Rooms
exports.addRoom = async (req, res, next) => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) return res.status(404).json({ error: 'Hostel not found' });
    if (hostel.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not authorized' });

    const room = await Room.create({ ...req.body, hostel: req.params.id });

    // Update hostel startingPrice
    const rooms = await Room.find({ hostel: req.params.id });
    const minPrice = Math.min(...rooms.map((r) => r.monthlyPrice));
    await Hostel.findByIdAndUpdate(req.params.id, { startingPrice: minPrice });

    res.status(201).json(room);
  } catch (err) {
    next(err);
  }
};

exports.updateRoom = async (req, res, next) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.roomId, req.body, { new: true });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  } catch (err) {
    next(err);
  }
};

exports.deleteRoom = async (req, res, next) => {
  try {
    await Room.findByIdAndDelete(req.params.roomId);
    res.json({ message: 'Room deleted' });
  } catch (err) {
    next(err);
  }
};
