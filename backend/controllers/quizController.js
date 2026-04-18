const QuizResult = require('../models/QuizResult');

// @desc    Submit quiz result
// @route   POST /api/quizzes/submit
// @access  Protected (Student)
const submitQuiz = async (req, res) => {
    const { moduleId, score, totalMarks } = req.body;

    try {
        // Simple readiness calculation: percentage-based
        const readinessScore = (score / totalMarks) * 100;

        const result = new QuizResult({
            user: req.user._id,
            moduleId,
            score,
            totalMarks,
            readinessScore
        });

        const savedResult = await result.save();
        res.status(201).json(savedResult);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user's results
// @route   GET /api/quizzes/my-results
// @access  Protected
const getMyResults = async (req, res) => {
    try {
        const results = await QuizResult.find({ user: req.user._id }).populate('moduleId', 'title');
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { submitQuiz, getMyResults };
