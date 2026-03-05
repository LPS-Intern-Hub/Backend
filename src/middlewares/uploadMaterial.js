const multer = require('multer');

// Use memory storage for S3 upload
const materialStorage = multer.memoryStorage();

// File filter for materials
const materialFilter = (req, file, cb) => {
    const allowedMimes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'video/mp4'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Format file tidak didukung. Gunakan PDF, Word, PPT, Excel, Gambar, atau Video.'), false);
    }
};

const uploadMaterial = multer({
    storage: materialStorage,
    fileFilter: materialFilter,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB max for materials
    }
});

module.exports = uploadMaterial;
