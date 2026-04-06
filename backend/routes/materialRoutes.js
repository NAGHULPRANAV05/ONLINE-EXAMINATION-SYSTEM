const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, requireAdmin } = require('../middleware/authMiddleware');
const {
    uploadMaterial,
    getAllMaterials,
    getMaterialById,
    updateMaterial,
    deleteMaterial,
    downloadMaterial,
    viewMaterial
} = require('../controllers/materialController');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'materials');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

// File filter — only allow PDF, DOCX, PPT, PPTX, ZIP
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.zip'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF, DOC, DOCX, PPT, PPTX, and ZIP files are allowed'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50 MB max
});

// Wrapper: catches Multer errors and returns proper JSON instead of crashing
const handleUpload = (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (!err) return next();
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ success: false, message: 'File too large. Maximum allowed size is 50 MB.' });
            }
            return res.status(400).json({ success: false, message: err.message || 'File upload error.' });
        }
        return res.status(400).json({ success: false, message: err.message || 'Upload failed. Please try again.' });
    });
};

// Routes
router.post('/', protect, requireAdmin, handleUpload, uploadMaterial);
router.get('/', protect, getAllMaterials);
router.get('/:id', protect, getMaterialById);
router.get('/:id/download', protect, downloadMaterial);
router.get('/:id/view', protect, viewMaterial);
router.put('/:id', protect, requireAdmin, handleUpload, updateMaterial);
router.delete('/:id', protect, requireAdmin, deleteMaterial);

module.exports = router;
