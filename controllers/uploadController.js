const multer = require('multer');
const path = require('path');
const imageDownloader = require('image-downloader');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6) + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  if (allowed.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
  else cb(new Error('Only image files are allowed'), false);
};

exports.upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

exports.uploadImages = (req, res) => {
  const files = req.files.map((f) => f.filename);
  res.json(files);
};

exports.uploadByLink = async (req, res, next) => {
  try {
    const { link } = req.body;
    if (!link) return res.status(400).json({ error: 'Link is required' });
    const newName = 'photo_' + Date.now() + '.jpg';
    await imageDownloader.image({
      url: link,
      dest: path.join(__dirname, '../uploads/', newName),
    });
    res.json(newName);
  } catch (err) {
    next(err);
  }
};
