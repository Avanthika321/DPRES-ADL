const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Please add a password']
    },
    role: {
        type: String,
        enum: ['student', 'teacher', 'admin'],
        default: 'student'
    },
    score: {
        type: Number,
        default: 0
    },
    institution: {
        type: String,
        default: 'CrisisCraft Academy'
    },
    standard: {
        type: String,
        default: ''
    },
    section: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Pre-save hook for password hashing and email normalization
userSchema.pre('save', async function() {
    // Normalize email
    if (this.isModified('email')) {
        this.email = this.email.toLowerCase();
    }

    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to match password
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
