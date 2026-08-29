const express = require('express');
const router = express.Router();
const {
    register, login, getMe,
    getAllStudents, toggleBlockStudent,
    createStudent, deleteStudent,
    updateStudentPassword
} = require('../controllers/authController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

// Admin Student Management (CRUD, Blocking & Password Reset)
router.get('/students', protect, requireAdmin, getAllStudents);
router.post('/students', protect, requireAdmin, createStudent);
router.put('/students/:id/block', protect, requireAdmin, toggleBlockStudent);
router.put('/students/:id/password', protect, requireAdmin, updateStudentPassword);
router.delete('/students/:id', protect, requireAdmin, deleteStudent);

module.exports = router;
