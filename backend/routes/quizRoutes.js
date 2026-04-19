const express = require('express');
const router = express.Router();
const { createQuiz, getQuizzes, getQuiz, submitQuiz, getMyResults } = require('../controllers/quizController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/', protect, authorize('teacher'), createQuiz);
router.get('/', protect, getQuizzes);
router.get('/:id', protect, getQuiz);
router.post('/submit', protect, submitQuiz);
router.get('/my-results', protect, getMyResults);

module.exports = router;
