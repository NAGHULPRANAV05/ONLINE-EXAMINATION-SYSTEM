const express = require('express');
const router = express.Router();
const {
    submitExam,
    getStudentResults,
    getResultById,
    getAllResults,
    getAnalytics,
    deleteResult
} = require('../controllers/resultController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

router.post('/submit', protect, submitExam);
router.get('/student/:studentId', protect, getStudentResults);
router.get('/analytics', protect, requireAdmin, getAnalytics);
router.get('/:id', protect, getResultById);
router.get('/', protect, requireAdmin, getAllResults);
router.delete('/:id', protect, requireAdmin, deleteResult);

module.exports = router;
