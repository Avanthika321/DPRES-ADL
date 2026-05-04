const mongoose = require('mongoose');

const achievementSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    achievementType: {
        type: String,
        required: true,
        enum: ['safety_star', 'fire_warden', 'heart_hero', 'flood_guide', 'quiz_master', 'drill_champion', 'first_module', 'perfect_score']
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    badgeIcon: {
        type: String,
        default: 'fa-medal'
    },
    unlockedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Ensure one achievement of each type per user
achievementSchema.index({ user: 1, achievementType: 1 }, { unique: true });

module.exports = mongoose.model('Achievement', achievementSchema);
