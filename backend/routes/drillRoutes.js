const express = require('express');
const router = express.Router();
const { createDrill, getDrills, getDrill, updateDrill } = require('../controllers/drillController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/', protect, authorize('admin'), createDrill);
router.get('/', protect, getDrills);
router.get('/:id', protect, getDrill);
router.put('/:id', protect, authorize('admin'), updateDrill);

module.exports = router;