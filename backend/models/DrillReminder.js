const mongoose = require('mongoose');

const drillReminderSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    drill: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Drill',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    sentAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('DrillReminder', drillReminderSchema);
