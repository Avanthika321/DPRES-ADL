const mongoose = require('mongoose');

const drillSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    disasterType: {
        type: String,
        required: true,
        enum: ['Earthquake', 'Fire', 'Flood', 'Tornado', 'Hurricane', 'Chemical', 'Multiple', 'Other']
    },
    scheduledDate: {
        type: Date,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Scheduled', 'Active', 'Completed', 'Cancelled'],
        default: 'Scheduled'
    },
    targetStandard: {
        type: String,
        default: ''
    },
    targetSection: {
        type: String,
        default: ''
    },
    participation: {
        type: Number,
        default: 0
    },
    score: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Drill', drillSchema);