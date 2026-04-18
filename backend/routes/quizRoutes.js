const express = require('express');
const router = express.Router();
const { submitQuiz, getMyResults } = require('../controllers/quizController');
const { protect } = require('../middleware/authMiddleware');

router.post('/submit', protect, submitQuiz);
router.get('/my-results', protect, getMyResults);

module.exports = router;
