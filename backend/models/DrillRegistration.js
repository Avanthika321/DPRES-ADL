const mongoose = require('mongoose');

const drillRegistrationSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    drill: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Drill'
    },
    participated: {
        type: Boolean,
        default: false
    },
    score: {
        type: Number,
        default: 0
    },
    feedback: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Ensure one registration per user per drill
drillRegistrationSchema.index({ user: 1, drill: 1 }, { unique: true });

module.exports = mongoose.model('DrillRegistration', drillRegistrationSchema);
