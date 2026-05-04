const express = require('express');
const router = express.Router();
const { getStudentStats, getAchievements } = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/stats', protect, authorize('student'), getStudentStats);
router.get('/achievements', protect, authorize('student'), getAchievements);

module.exports = router;
