const QuizResult = require('../models/QuizResult');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const Achievement = require('../models/Achievement');

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

// @desc    Update a quiz
// @route   PATCH /api/quizzes/:id
// @access  Protected (Teacher)
const updateQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        const updatedQuiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedQuiz);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a quiz
// @route   DELETE /api/quizzes/:id
// @access  Protected (Teacher)
const deleteQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        await Quiz.findByIdAndDelete(req.params.id);
        // Also remove all results for this quiz
        await QuizResult.deleteMany({ quizId: req.params.id });
        res.json({ message: 'Quiz deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Submit quiz result
// @route   POST /api/quizzes/submit
// @access  Protected (Student)
const submitQuiz = async (req, res) => {
    const { quizId, answers } = req.body;

    try {
        // Get the quiz to calculate score
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        // Calculate score from answers
        let score = 0;
        const marksPerQuestion = quiz.totalMarks / quiz.questionsList.length;
        const processedAnswers = [];

        answers.forEach((answer, index) => {
            const question = quiz.questionsList[index];
            const isCorrect = question && answer.selectedOption === question.correct;
            if (isCorrect) score += marksPerQuestion;
            processedAnswers.push({
                questionIndex: index,
                selectedOption: answer.selectedOption,
                isCorrect: isCorrect || false
            });
        });

        score = Math.round(score * 100) / 100; // Round to 2 decimal places
        const readinessScore = (score / quiz.totalMarks) * 100;

        const result = new QuizResult({
            user: req.user._id,
            quizId,
            answers: processedAnswers,
            score,
            totalMarks: quiz.totalMarks,
            readinessScore: Math.round(readinessScore * 100) / 100
        });

        const savedResult = await result.save();

        // Update user's total score (add quiz score as points)
        await User.findByIdAndUpdate(req.user._id, {
            $inc: { score: Math.round(readinessScore) }
        });

        // Check for achievements
        await checkAndAwardAchievements(req.user._id, readinessScore);

        res.status(201).json(savedResult);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper: Check and award achievements after quiz submission
async function checkAndAwardAchievements(userId, readinessScore) {
    try {
        // Perfect score achievement
        if (readinessScore === 100) {
            await Achievement.findOneAndUpdate(
                { user: userId, achievementType: 'perfect_score' },
                {
                    user: userId,
                    achievementType: 'perfect_score',
                    name: 'Academic Ace',
                    description: 'Achieved a perfect 100% score on a knowledge assessment.',
                    badgeIcon: 'fa-star',
                    unlockedAt: new Date()
                },
                { upsert: true, new: true }
            );
        }

        // Quiz master - completed 5 quizzes
        const quizCount = await QuizResult.countDocuments({ user: userId });
        if (quizCount >= 5) {
            await Achievement.findOneAndUpdate(
                { user: userId, achievementType: 'quiz_master' },
                {
                    user: userId,
                    achievementType: 'quiz_master',
                    name: 'Quiz Master',
                    description: 'Demonstrated consistent learning by completing 5 knowledge quizzes.',
                    badgeIcon: 'fa-brain',
                    unlockedAt: new Date()
                },
                { upsert: true, new: true }
            );
        }

        // Heart Hero - scored 95%+ on any quiz
        if (readinessScore >= 95) {
            await Achievement.findOneAndUpdate(
                { user: userId, achievementType: 'heart_hero' },
                {
                    user: userId,
                    achievementType: 'heart_hero',
                    name: 'Safety Scholar',
                    description: 'Scored above 95% on a quiz, showing elite readiness levels.',
                    badgeIcon: 'fa-heartbeat',
                    unlockedAt: new Date()
                },
                { upsert: true, new: true }
            );
        }
    } catch (error) {
        console.error('Achievement check error:', error.message);
    }
}

// @desc    Get user's results
// @route   GET /api/quizzes/my-results
// @access  Protected
const getMyResults = async (req, res) => {
    try {
        const results = await QuizResult.find({ user: req.user._id })
            .populate('quizId', 'title totalMarks timeLimit')
            .sort({ createdAt: -1 });
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createQuiz, getQuizzes, getQuiz, updateQuiz, deleteQuiz, submitQuiz, getMyResults };
