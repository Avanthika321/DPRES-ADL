const User = require('../models/User');
const Module = require('../models/Module');
const QuizResult = require('../models/QuizResult');

// @desc    Get system analytics
// @route   GET /api/admin/stats
// @access  Protected (Admin)
const getStats = async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const moduleCount = await Module.countDocuments();
        const quizCount = await QuizResult.countDocuments();
        
        // Calculate average readiness across all results
        const results = await QuizResult.find({});
        const avgReadiness = results.length > 0 
            ? results.reduce((acc, curr) => acc + curr.readinessScore, 0) / results.length 
            : 0;

        res.json({
            users: userCount,
            modules: moduleCount,
            totalQuizzes: quizCount,
            systemReadiness: avgReadiness.toFixed(2)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Protected (Admin)
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getStats, getAllUsers };
