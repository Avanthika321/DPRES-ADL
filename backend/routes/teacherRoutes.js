const express = require('express');
const router = express.Router();
const { getTeacherStats, getStudentPerformance } = require('../controllers/teacherController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/stats', protect, authorize('teacher'), getTeacherStats);
router.get('/student-performance', protect, authorize('teacher'), getStudentPerformance);

module.exports = router;
