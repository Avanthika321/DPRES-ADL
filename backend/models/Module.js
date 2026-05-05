const mongoose = require('mongoose');

const moduleSchema = mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title']
    },
    disasterType: {
        type: String,
        enum: ['Earthquake', 'Fire', 'Flood', 'Tornado', 'Hurricane', 'Chemical', 'First Aid', 'General', 'Other'],
        default: 'General'
    },
    content: {
        type: String,
        default: ''
    },
    fileName: {
        type: String,
        required: false
    },
    fileData: {
        type: String,
        required: false
    },
    students: {
        type: Number,
        default: 0
    },
    completion: {
        type: Number,
        default: 0
    },
    targetStandard: {
        type: String,
        default: ''
    },
    targetSection: {
        type: String,
        default: ''
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Module', moduleSchema);