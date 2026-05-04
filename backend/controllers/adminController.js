const User = require('../models/User');
const Module = require('../models/Module');
const Quiz = require('../models/Quiz');
const QuizResult = require('../models/QuizResult');
const Drill = require('../models/Drill');
const DrillRegistration = require('../models/DrillRegistration');
const UserProgress = require('../models/UserProgress');
const Achievement = require('../models/Achievement');
const Alert = require('../models/Alert');

// @desc    Get system analytics
// @route   GET /api/admin/stats
// @access  Protected (Admin)
const getStats = async (req, res) => {
    try {
        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalTeachers = await User.countDocuments({ role: 'teacher' });
        const moduleCount = await Module.countDocuments();
        const quizCount = await Quiz.countDocuments();
        const drillCount = await Drill.countDocuments();
        const activeDrills = await Drill.countDocuments({ status: { $in: ['Scheduled', 'Active'] } });

        // Calculate average readiness across all quiz results
        const results = await QuizResult.find({});
        const avgReadiness = results.length > 0
            ? results.reduce((acc, curr) => acc + curr.readinessScore, 0) / results.length
            : 0;

        res.json({
            totalStudents,
            totalTeachers,
            totalUsers: totalStudents + totalTeachers,
            modules: moduleCount,
            quizzes: quizCount,
            drills: drillCount,
            activeDrills,
            systemReadiness: Math.round(avgReadiness)
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
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new user (admin-created)
// @route   POST /api/admin/users
// @access  Protected (Admin)
const createUser = async (req, res) => {
    const { name, email, password, role, standard, section } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const user = await User.create({
            name,
            email,
            password: password || 'crisiscraft123', // default password
            role: role || 'student',
            standard: standard || '',
            section: section || ''
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            standard: user.standard,
            section: user.section,
            score: user.score
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a user
// @route   PATCH /api/admin/users/:id
// @access  Protected (Admin)
const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.role = req.body.role || user.role;
        user.standard = req.body.standard || user.standard;
        user.section = req.body.section || user.section;

        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            standard: updatedUser.standard,
            section: updatedUser.section,
            score: updatedUser.score
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Protected (Admin)
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Don't allow deleting self
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        await User.findByIdAndDelete(req.params.id);
        // Clean up related data
        await QuizResult.deleteMany({ user: req.params.id });
        await UserProgress.deleteMany({ user: req.params.id });
        await DrillRegistration.deleteMany({ user: req.params.id });
        await Achievement.deleteMany({ user: req.params.id });

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Send emergency alert
// @route   POST /api/admin/alerts
// @access  Protected (Admin)
const sendAlert = async (req, res) => {
    const { message, type } = req.body;

    try {
        const alert = await Alert.create({
            message,
            type: type || 'Info',
            createdBy: req.user._id
        });

        res.status(201).json(alert);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all active alerts
// @route   GET /api/admin/alerts
// @access  Protected
const getAlerts = async (req, res) => {
    try {
        const alerts = await Alert.find({ active: true }).sort({ createdAt: -1 });
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete/Dismiss alert
// @route   DELETE /api/admin/alerts/:id
// @access  Protected (Admin)
const deleteAlert = async (req, res) => {
    try {
        await Alert.findByIdAndDelete(req.params.id);
        res.json({ message: 'Alert dismissed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get detailed system report
// @route   GET /api/admin/reports
// @access  Protected (Admin)
const getDetailedReport = async (req, res) => {
    try {
        console.log('📊 Generating detailed report...');
        const users = await User.find({ role: 'student' }).select('name email score institution standard section');
        console.log(`✅ Found ${users.length} students. Sample:`, users.length > 0 ? { n: users[0].name, e: users[0].email, st: users[0].standard, sc: users[0].section } : 'none');
        
        const quizResults = await QuizResult.find().populate('quizId', 'title');
        console.log(`✅ Found ${quizResults.length} quiz results`);
        
        const drillParticipation = await DrillRegistration.find().populate('drill', 'title');
        console.log(`✅ Found ${drillParticipation.length} drill registrations`);

        res.json({
            users,
            quizResults,
            drillParticipation
        });
    } catch (error) {
        console.error('❌ GetDetailedReport Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get leaderboard (top students by score)
// @route   GET /api/admin/leaderboard
// @access  Protected
const getLeaderboard = async (req, res) => {
    try {
        const students = await User.find({ role: 'student' })
            .select('name email score institution standard section')
            .sort({ score: -1 })
            .limit(20);
        res.json(students);
    } catch (error) {
        console.error('❌ GetLeaderboard Error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { 
    getStats, 
    getAllUsers, 
    createUser, 
    deleteUser, 
    updateUser,
    getLeaderboard,
    sendAlert,
    getAlerts,
    deleteAlert,
    getDetailedReport
};
