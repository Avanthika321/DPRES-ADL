const express = require('express');
const router = express.Router();
const { getModules, createModule } = require('../controllers/moduleController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

console.log('📦 Loading moduleRoutes');

// POST route with authentication and authorization
router.post('/', protect, authorize('teacher', 'admin'), createModule);

// GET route (public access)
router.get('/', getModules);

module.exports = router;
