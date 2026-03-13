const express = require('express');
const router = express.Router();
const { executeCodeController } = require('../controllers/codeController');
const { protect } = require('../middleware/authMiddleware');

router.post('/execute', protect, executeCodeController);

module.exports = router;
