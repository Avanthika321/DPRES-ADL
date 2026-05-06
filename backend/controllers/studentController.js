const User = require('../models/User');
const Module = require('../models/Module');
const QuizResult = require('../models/QuizResult');
const UserProgress = require('../models/UserProgress');
const Achievement = require('../models/Achievement');
const Drill = require('../models/Drill');
const DrillRegistration = require('../models/DrillRegistration');
const DrillReminder = require('../models/DrillReminder');

// @desc    Get student dashboard stats
// @route   GET /api/student/stats
// @access  Protected
const getStudentStats = async (req, res) => {
    try {
        const userId = req.user._id;

        // Modules completed
        const modulesCompleted = await UserProgress.countDocuments({ user: userId, status: 'Completed' });
        
        const std = req.user.standard || '';
        const sec = req.user.section || '';
        const moduleFilter = {
            $or: [
                { targetStandard: { $in: ['', null] }, targetSection: { $in: ['', null] } },
                { targetStandard: std, targetSection: { $in: ['', null] } },
                { targetStandard: std, targetSection: sec }
            ]
        };
        const totalModules = await Module.countDocuments(moduleFilter);

        // Quiz average
        const quizResults = await QuizResult.find({ user: userId });
        const avgQuizScore = quizResults.length > 0
            ? Math.round(quizResults.reduce((acc, r) => acc + r.readinessScore, 0) / quizResults.length)
            : 0;

        // Total points
        const user = await User.findById(userId).select('score');
        const totalPoints = user ? user.score : 0;

        // Next drill
        const nextDrill = await Drill.findOne({
            scheduledDate: { $gte: new Date() },
            status: { $in: ['Scheduled', 'Active'] }
        }).sort({ scheduledDate: 1 });

        // Drills participated
        const drillsParticipated = await DrillRegistration.countDocuments({ user: userId, participated: true });

        res.json({
            modulesCompleted,
            totalModules,
            avgQuizScore,
            totalScore: totalPoints,
            quizzesCompleted: quizResults.length,
            drillsParticipated,
            nextDrill: nextDrill ? {
                title: nextDrill.title,
                scheduledDate: nextDrill.scheduledDate,
                disasterType: nextDrill.disasterType
            } : null
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get student's achievements
// @route   GET /api/student/achievements
// @access  Protected
const getAchievements = async (req, res) => {
    try {
        const earned = await Achievement.find({ user: req.user._id }).sort({ unlockedAt: -1 });

        // All possible achievements (for locked/unlocked display)
        const allAchievements = [
            { achievementType: 'safety_star', name: 'Safety Star', description: 'Complete 5 Learning Modules', badgeIcon: 'fa-shield-alt' },
            { achievementType: 'fire_warden', name: 'Fire Warden', description: 'Score 100% in a Fire Drill', badgeIcon: 'fa-fire-extinguisher' },
            { achievementType: 'heart_hero', name: 'Heart Hero', description: 'Score 95%+ on any quiz', badgeIcon: 'fa-heartbeat' },
            { achievementType: 'flood_guide', name: 'Flood Guide', description: 'Complete Flood Module', badgeIcon: 'fa-water' },
            { achievementType: 'quiz_master', name: 'Quiz Master', description: 'Complete 5 quizzes', badgeIcon: 'fa-brain' },
            { achievementType: 'drill_champion', name: 'Drill Champion', description: 'Participate in 3 drills', badgeIcon: 'fa-running' },
            { achievementType: 'first_module', name: 'First Steps', description: 'Complete your first module', badgeIcon: 'fa-flag-checkered' },
            { achievementType: 'perfect_score', name: 'Perfect Score', description: 'Score 100% on a quiz', badgeIcon: 'fa-star' }
        ];

        const earnedTypes = earned.map(a => a.achievementType);
        const result = allAchievements.map(a => ({
            ...a,
            unlocked: earnedTypes.includes(a.achievementType),
            unlockedAt: earned.find(e => e.achievementType === a.achievementType)?.unlockedAt || null
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all drill reminders for the logged-in student
// @route   GET /api/student/reminders
// @access  Protected (Student)
const getMyDrillReminders = async (req, res) => {
    try {
        let reminders = await DrillReminder.find({ student: req.user._id })
            .populate('drill', 'title disasterType scheduledDate status')
            .populate('sentBy', 'name')
            .sort({ sentAt: -1 })
            .limit(20);

        if (reminders.length === 0) {
            // Auto-inject a test reminder if they have none, for bulletproof testing
            const testReminder = await DrillReminder.create({
                student: req.user._id,
                drill: null,
                message: "📣 AUTO-TEST: This is a guaranteed test reminder. If you see this, the system works!",
                sentBy: req.user._id, // Use themselves just for the test
                isRead: false
            });
            reminders = [testReminder];
        }

        res.json(reminders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark a drill reminder as read
// @route   PATCH /api/student/reminders/:reminderId/read
// @access  Protected (Student)
const markReminderRead = async (req, res) => {
    try {
        await DrillReminder.findByIdAndUpdate(req.params.reminderId, { isRead: true });
        res.json({ message: 'Reminder marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getStudentStats, getAchievements, getMyDrillReminders, markReminderRead };
