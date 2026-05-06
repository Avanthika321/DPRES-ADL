const express = require('express');
const router = express.Router();
const { getStudentStats, getAchievements, getMyDrillReminders, markReminderRead } = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/stats', protect, authorize('student'), getStudentStats);
router.get('/achievements', protect, authorize('student'), getAchievements);
router.get('/reminders', protect, authorize('student'), getMyDrillReminders);
router.patch('/reminders/:reminderId/read', protect, authorize('student'), markReminderRead);

module.exports = router;
