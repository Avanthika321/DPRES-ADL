const QuizResult = require('../models/QuizResult');
const Quiz = require('../models/Quiz');

// @desc    Create a new quiz
// @route   POST /api/quizzes
// @access  Protected (Teacher)
const createQuiz = async (req, res) => {
    const { title, questionsList, timeLimit, totalMarks } = req.body;

    try {
        const quiz = new Quiz({
            title,
            questionsList,
            timeLimit,
            totalMarks,
            createdBy: req.user._id
        });

        const savedQuiz = await quiz.save();
        res.status(201).json(savedQuiz);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all quizzes
// @route   GET /api/quizzes
// @access  Protected
const getQuizzes = async (req, res) => {
    try {
        const quizzes = await Quiz.find().populate('createdBy', 'name');
        res.json(quizzes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single quiz
// @route   GET /api/quizzes/:id
// @access  Protected
const getQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id).populate('createdBy', 'name');
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        res.json(quiz);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

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

module.exports = { createQuiz, getQuizzes, getQuiz, submitQuiz, getMyResults };
