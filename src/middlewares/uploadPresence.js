// cSpell:words Hanya diperbolehkan gambar
const multer = require('multer');

// Use memory storage for S3 upload (file disimpan di buffer, bukan disk)
const presenceStorage = multer.memoryStorage();

// File filter for images only
const imageFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar (JPG, PNG) yang diperbolehkan'), false);
  }
};

// Configure multer for presence (upload ke S3)
const uploadPresence = multer({
  storage: presenceStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

module.exports = uploadPresence;
