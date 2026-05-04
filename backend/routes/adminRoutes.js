const express = require('express');
const router = express.Router();
const { 
    getStats, 
    getAllUsers, 
    createUser, 
    updateUser,
    deleteUser, 
    getLeaderboard,
    sendAlert,
    getAlerts,
    deleteAlert,
    getDetailedReport
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/stats', protect, authorize('admin'), getStats);
router.get('/users', protect, authorize('admin'), getAllUsers);
router.post('/users', protect, authorize('admin'), createUser);
router.patch('/users/:id', protect, authorize('admin'), updateUser);
router.delete('/users/:id', protect, authorize('admin'), deleteUser);
router.get('/leaderboard', protect, getLeaderboard);

// Alert Routes
router.post('/alerts', protect, authorize('admin'), sendAlert);
router.get('/alerts', protect, getAlerts);
router.delete('/alerts/:id', protect, authorize('admin'), deleteAlert);

// Report Routes
router.get('/reports', protect, authorize('admin'), getDetailedReport);

module.exports = router;
