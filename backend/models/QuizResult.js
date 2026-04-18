const mongoose = require('mongoose');

const quizResultSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    moduleId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Module'
    },
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
