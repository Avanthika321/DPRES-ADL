const express = require('express');
const router = express.Router();
const { getStats, getAllUsers } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/stats', protect, authorize('admin'), getStats);
router.get('/users', protect, authorize('admin'), getAllUsers);

module.exports = router;
