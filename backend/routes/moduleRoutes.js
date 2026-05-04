const express = require('express');
const router = express.Router();
const { getModules, getModule, createModule, updateModule, deleteModule, trackProgress, getMyProgress, startProgress } = require('../controllers/moduleController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Static routes first
router.get('/my-progress', protect, getMyProgress);
router.post('/', protect, authorize('teacher', 'admin'), createModule);
router.get('/', protect, getModules);

// Dynamic routes with :id
router.get('/:id', protect, getModule);
router.patch('/:id', protect, authorize('teacher', 'admin'), updateModule);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteModule);
router.post('/:id/progress', protect, trackProgress);
router.post('/:id/start', protect, startProgress);

module.exports = router;
