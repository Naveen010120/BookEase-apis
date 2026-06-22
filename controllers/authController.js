const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../Models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const setCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'All fields are required' });

    if (await User.findOne({ email }))
      return res.status(409).json({ error: 'Email already in use' });

    const allowedRoles = ['user', 'owner'];
    const assignedRole = allowedRoles.includes(role) ? role : 'user';

    const user = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, 10),
      role: assignedRole,
    });

    const token = signToken(user._id);
    setCookie(res, token);
    res.status(201).json({
      message: 'Registration successful',
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token,
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid password' });

    const token = signToken(user._id);
    setCookie(res, token);
    res.json({
      message: 'Login successful',
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
      token,
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  res.cookie('token', '', { maxAge: 0 });
  res.json({ message: 'Logged out successfully' });
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('savedHostels', 'hostelName city images startingPrice');
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, avatar },
      { new: true, runValidators: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.toggleSaveHostel = async (req, res, next) => {
  try {
    const { hostelId } = req.params;
    const user = await User.findById(req.user._id);
    const idx = user.savedHostels.indexOf(hostelId);
    if (idx === -1) {
      user.savedHostels.push(hostelId);
    } else {
      user.savedHostels.splice(idx, 1);
    }
    await user.save();
    res.json({ savedHostels: user.savedHostels });
  } catch (err) {
    next(err);
  }
};
