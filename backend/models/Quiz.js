const mongoose = require('mongoose');

const quizSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    questionsList: [{
        text: {
            type: String,
            required: true
        },
        options: [{
            type: String,
            required: true
        }],
        correct: {
            type: Number,
            required: true
        }
    }],
    timeLimit: {
        type: Number,
        required: true
    },
    totalMarks: {
        type: Number,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Quiz', quizSchema);