const mongoose = require('mongoose');

const quizResultSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Quiz'
    },
    answers: [{
        questionIndex: Number,
        selectedOption: Number,
        isCorrect: Boolean
    }],
    score: {
        type: Number,
        required: true
    },
    totalMarks: {
        type: Number,
        required: true
    },
    readinessScore: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('QuizResult', quizResultSchema);
