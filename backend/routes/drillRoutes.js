const express = require('express');
const router = express.Router();
const { createDrill, getDrills, getDrill, updateDrill, deleteDrill, getNextDrill, registerForDrill, getDrillParticipation } = require('../controllers/drillController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Static routes FIRST
router.get('/next', protect, getNextDrill);
router.get('/participation', protect, authorize('teacher', 'admin'), getDrillParticipation);
router.post('/', protect, authorize('admin', 'teacher'), createDrill);
router.get('/', protect, getDrills);

// Dynamic routes with :id
router.get('/:id', protect, getDrill);
router.put('/:id', protect, authorize('admin'), updateDrill);
router.delete('/:id', protect, authorize('admin'), deleteDrill);
router.post('/:id/register', protect, registerForDrill);

module.exports = router;