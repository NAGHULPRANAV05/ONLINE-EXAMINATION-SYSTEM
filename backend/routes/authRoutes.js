const express = require('express');
const router = express.Router();
const { register, login, getMe, getAllStudents, toggleBlockStudent } = require('../controllers/authController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

// Admin Student Management & Blocking
router.get('/students', protect, requireAdmin, getAllStudents);
router.put('/students/:id/block', protect, requireAdmin, toggleBlockStudent);

module.exports = router;
