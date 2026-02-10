// cSpell:words Hanya diperbolehkan
const multer = require('multer');

// Use memory storage for S3 upload (file disimpan di buffer, bukan disk)
const permissionStorage = multer.memoryStorage();

// File filter for documents and images
const documentFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file PDF, JPG, PNG yang diperbolehkan'), false);
  }
};

// Configure multer for permission documents (upload ke S3)
const uploadPermission = multer({
  storage: permissionStorage,
  fileFilter: documentFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

module.exports = uploadPermission;
