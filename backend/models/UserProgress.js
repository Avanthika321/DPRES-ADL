const mongoose = require('mongoose');

const userProgressSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    module: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Module'
    },
    status: {
        type: String,
        enum: ['Not Started', 'In Progress', 'Completed'],
        default: 'Not Started'
    },
    percentComplete: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    startedAt: {
        type: Date,
        default: null
    },
    completedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Ensure one progress entry per user per module
userProgressSchema.index({ user: 1, module: 1 }, { unique: true });

module.exports = mongoose.model('UserProgress', userProgressSchema);
