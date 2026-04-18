// const mongoose = require('mongoose');

// const moduleSchema = mongoose.Schema({
//     title: {
//         type: String,
//         required: [true, 'Please add a title']
//     },
//     disasterType: {
//         type: String,
//         required: [true, 'Please specify disaster type (e.g., Fire, Flood, Earthquake)'],
//     },
//     content: {
//         type: String,
//         required: [true, 'Please add module content']
//     },
//     createdBy: {
//         type: mongoose.Schema.Types.ObjectId,
//         required: true,
//         ref: 'User'
//     }
// }, {
//     timestamps: true
// });

// module.exports = mongoose.model('Module', moduleSchema);
const mongoose = require('mongoose');

const moduleSchema = mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title']
    },

    fileName: {
        type: String,
        required: false
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