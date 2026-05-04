const express = require('express');
const router = express.Router();
const { createQuiz, getQuizzes, getQuiz, submitQuiz, getMyResults, updateQuiz, deleteQuiz } = require('../controllers/quizController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// IMPORTANT: Static routes MUST come before /:id to avoid Express matching them as IDs
router.post('/', protect, authorize('teacher'), createQuiz);
router.get('/', protect, getQuizzes);
router.post('/submit', protect, submitQuiz);
router.get('/my-results', protect, getMyResults);

// Dynamic routes (with :id) come AFTER static routes
router.get('/:id', protect, getQuiz);
router.patch('/:id', protect, authorize('teacher'), updateQuiz);
router.delete('/:id', protect, authorize('teacher'), deleteQuiz);

module.exports = router;
