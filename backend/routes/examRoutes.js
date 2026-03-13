const express = require('express');
const router = express.Router();
const {
    createExam,
    getAllExams,
    getExamById,
    updateExam,
    deleteExam,
    publishExam
} = require('../controllers/examController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', protect, getAllExams);
router.get('/:id', protect, getExamById);
router.post('/', protect, requireAdmin, createExam);
router.put('/:id', protect, requireAdmin, updateExam);
router.delete('/:id', protect, requireAdmin, deleteExam);
router.patch('/:id/publish', protect, requireAdmin, publishExam);

module.exports = router;
