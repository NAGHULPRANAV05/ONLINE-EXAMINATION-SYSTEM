const express = require('express');
const router = express.Router();
const {
    createSubject,
    getAllSubjects,
    getSubjectById,
    updateSubject,
    deleteSubject
} = require('../controllers/subjectController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', getAllSubjects);
router.get('/:id', getSubjectById);
router.post('/', protect, requireAdmin, createSubject);
router.put('/:id', protect, requireAdmin, updateSubject);
router.delete('/:id', protect, requireAdmin, deleteSubject);

module.exports = router;
