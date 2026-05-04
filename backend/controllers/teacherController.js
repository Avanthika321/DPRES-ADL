const User = require('../models/User');
const Module = require('../models/Module');
const Quiz = require('../models/Quiz');
const QuizResult = require('../models/QuizResult');
const UserProgress = require('../models/UserProgress');
const DrillRegistration = require('../models/DrillRegistration');

// @desc    Get teacher dashboard stats
// @route   GET /api/teacher/stats
// @access  Protected (Teacher)
const getTeacherStats = async (req, res) => {
    try {
        const teacherId = req.user._id;

        // Modules uploaded by this teacher
        const modulesCount = await Module.countDocuments({ createdBy: teacherId });
        
        // Active quizzes by this teacher
        const quizzesCount = await Quiz.countDocuments({ createdBy: teacherId });

        // Total students (system-wide for now, or could be filtered by institution)
        const studentsCount = await User.countDocuments({ role: 'student' });

        // Average score for quizzes created by this teacher
        const teacherQuizzes = await Quiz.find({ createdBy: teacherId }).select('_id');
        const teacherQuizIds = teacherQuizzes.map(q => q._id);
        
        const results = await QuizResult.find({ quizId: { $in: teacherQuizIds } });
        const avgScore = results.length > 0
            ? Math.round(results.reduce((acc, r) => acc + r.readinessScore, 0) / results.length)
            : 0;

        res.json({
            studentsCount,
            modulesCount,
            quizzesCount,
            avgScore
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get per-student performance data
// @route   GET /api/teacher/student-performance
// @access  Protected (Teacher)
const getStudentPerformance = async (req, res) => {
    try {
        const teacherId = req.user._id;

        // Get all students
        const students = await User.find({ role: 'student' }).select('_id name standard section');

        // Get total modules count
        const totalModules = await Module.countDocuments();

        // Get quizzes created by this teacher
        const teacherQuizIds = (await Quiz.find({ createdBy: teacherId }).select('_id')).map(q => q._id);

        const performanceData = await Promise.all(students.map(async (student) => {
            // Module completion percentage
            const completedModules = await UserProgress.countDocuments({
                user: student._id,
                status: 'Completed'
            });
            const moduleAvg = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

            // Average quiz score (for quizzes created by this teacher)
            const quizResults = await QuizResult.find({
                user: student._id,
                quizId: { $in: teacherQuizIds }
            });
            const quizScore = quizResults.length > 0
                ? Math.round(quizResults.reduce((acc, r) => acc + r.readinessScore, 0) / quizResults.length) + '%'
                : 'N/A';

            // Drill readiness: has participated in at least 1 drill
            const drillCount = await DrillRegistration.countDocuments({
                user: student._id,
                participated: true
            });
            const drillReady = drillCount > 0 ? 'Yes' : 'No';

            return {
                name: student.name,
                standard: student.standard || '-',
                section: student.section || '-',
                moduleAvg,
                quizScore,
                drillReady
            };
        }));

        res.json(performanceData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getTeacherStats, getStudentPerformance };
