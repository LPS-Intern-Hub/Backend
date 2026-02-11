const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/permissions');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure disk storage for local file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const userId = req.user?.id_users || 'unknown';
        const timestamp = Date.now();
        const fileExtension = path.extname(file.originalname);
        const fileName = `${userId}-${timestamp}${fileExtension}`;
        cb(null, fileName);
    }
});

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

// Configure multer for permission documents (local storage)
const uploadPermissionLocal = multer({
    storage: storage,
    fileFilter: documentFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    }
});

module.exports = uploadPermissionLocal;
