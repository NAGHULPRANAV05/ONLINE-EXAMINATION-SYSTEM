const express = require('express');
const router = express.Router();
const {
    createQuestion,
    getAllQuestions,
    getQuestionById,
    updateQuestion,
    deleteQuestion,
    generateAIQuestions
} = require('../controllers/questionController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

// AI generation route (must be before /:id route to avoid conflicts)
router.post('/generate-ai', protect, requireAdmin, generateAIQuestions);

router.get('/', protect, getAllQuestions);
router.get('/:id', protect, getQuestionById);
router.post('/', protect, requireAdmin, createQuestion);
router.put('/:id', protect, requireAdmin, updateQuestion);
router.delete('/:id', protect, requireAdmin, deleteQuestion);

module.exports = router;
