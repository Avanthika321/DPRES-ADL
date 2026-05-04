const Module = require('../models/Module');
const UserProgress = require('../models/UserProgress');
const Achievement = require('../models/Achievement');

// @desc    Get all modules
// @route   GET /api/modules
// @access  Protected
const getModules = async (req, res) => {
    try {
        let filter = {};
        if (req.user && req.user.role === 'student') {
            const std = req.user.standard || '';
            const sec = req.user.section || '';
            
            filter = {
                $or: [
                    { targetStandard: { $in: ['', null] }, targetSection: { $in: ['', null] } }, // Global modules
                    { targetStandard: std, targetSection: { $in: ['', null] } }, // Standard-wide modules
                    { targetStandard: std, targetSection: sec } // Specific section modules
                ]
            };
            console.log(`🔍 Filtering modules for student ${req.user.name} (Std: ${std}, Sec: ${sec})`);
        }
        const modules = await Module.find(filter).populate('createdBy', 'name standard section role');
        res.json(modules);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single module
// @route   GET /api/modules/:id
// @access  Protected
const getModule = async (req, res) => {
    try {
        const module = await Module.findById(req.params.id).populate('createdBy', 'name standard section role');
        if (!module) {
            return res.status(404).json({ message: 'Module not found' });
        }
        res.json(module);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a module
// @route   POST /api/modules
// @access  Protected (Teacher/Admin)
const createModule = async (req, res) => {
    const { title, fileName, content, disasterType, targetStandard, targetSection } = req.body;

    // Safety check: ensure user is authenticated
    if (!req.user) {
        return res.status(401).json({ message: 'User must be authenticated to create a module' });
    }

    // Validation
    if (!title) {
        return res.status(400).json({ message: 'Title is required' });
    }

    try {
        const module = new Module({
            title,
            fileName,
            content: content || '',
            disasterType: disasterType || 'General',
            targetStandard: targetStandard || '',
            targetSection: targetSection || '',
            createdBy: req.user._id
        });

        const createdModule = await module.save();
        res.status(201).json(createdModule);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a module
// @route   PATCH /api/modules/:id
// @access  Protected (Teacher/Admin)
const updateModule = async (req, res) => {
    try {
        const module = await Module.findById(req.params.id);
        if (!module) {
            return res.status(404).json({ message: 'Module not found' });
        }

        const updatedModule = await Module.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedModule);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a module
// @route   DELETE /api/modules/:id
// @access  Protected (Teacher/Admin)
const deleteModule = async (req, res) => {
    try {
        const module = await Module.findById(req.params.id);
        if (!module) {
            return res.status(404).json({ message: 'Module not found' });
        }

        await Module.findByIdAndDelete(req.params.id);
        // Also remove progress tracking for this module
        await UserProgress.deleteMany({ module: req.params.id });
        res.json({ message: 'Module deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Track module progress for student
// @route   POST /api/modules/:id/progress
// @access  Protected (Student)
const trackProgress = async (req, res) => {
    const { percentComplete } = req.body;

    try {
        const module = await Module.findById(req.params.id);
        if (!module) {
            return res.status(404).json({ message: 'Module not found' });
        }

        const isCompleted = percentComplete >= 100;

        const progress = await UserProgress.findOneAndUpdate(
            { user: req.user._id, module: req.params.id },
            {
                user: req.user._id,
                module: req.params.id,
                status: isCompleted ? 'Completed' : 'In Progress',
                percentComplete: Math.min(percentComplete, 100),
                startedAt: new Date(),
                ...(isCompleted && { completedAt: new Date() })
            },
            { upsert: true, new: true }
        );

        // Update module's student count
        const uniqueStudents = await UserProgress.countDocuments({ module: req.params.id });
        const completedStudents = await UserProgress.countDocuments({ module: req.params.id, status: 'Completed' });
        const completionRate = uniqueStudents > 0 ? Math.round((completedStudents / uniqueStudents) * 100) : 0;

        await Module.findByIdAndUpdate(req.params.id, {
            students: uniqueStudents,
            completion: completionRate
        });

        // Check for achievements if completed
        if (isCompleted) {
            await checkModuleAchievements(req.user._id, module);
        }

        res.json(progress);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const startProgress = async (req, res) => {
    try {
        const module = await Module.findById(req.params.id);
        if (!module) {
            return res.status(404).json({ message: 'Module not found' });
        }

        const progress = await UserProgress.findOneAndUpdate(
            { user: req.user._id, module: req.params.id },
            {
                $setOnInsert: {
                    user: req.user._id,
                    module: req.params.id,
                    status: 'In Progress',
                    percentComplete: 0,
                    startedAt: new Date()
                }
            },
            { upsert: true, new: true }
        );

        res.json(progress);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get student's progress across all modules
// @route   GET /api/modules/my-progress
// @access  Protected
const getMyProgress = async (req, res) => {
    try {
        const progress = await UserProgress.find({ user: req.user._id })
            .populate('module', 'title disasterType fileName')
            .sort({ updatedAt: -1 });
        res.json(progress);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper: Check and award achievements for modules
async function checkModuleAchievements(userId, completedModule) {
    try {
        // First Module Achievement
        await Achievement.findOneAndUpdate(
            { user: userId, achievementType: 'first_module' },
            {
                user: userId,
                achievementType: 'first_module',
                name: 'Getting Started',
                description: 'Completed your first learning module.',
                badgeIcon: 'fa-book-reader',
                unlockedAt: new Date()
            },
            { upsert: true, new: true }
        );

        // Safety Star Achievement (5 modules)
        const completedCount = await UserProgress.countDocuments({ user: userId, status: 'Completed' });
        if (completedCount >= 5) {
            await Achievement.findOneAndUpdate(
                { user: userId, achievementType: 'safety_star' },
                {
                    user: userId,
                    achievementType: 'safety_star',
                    name: 'Safety Star',
                    description: 'Demonstrated mastery by completing 5 safety modules.',
                    badgeIcon: 'fa-star',
                    unlockedAt: new Date()
                },
                { upsert: true, new: true }
            );
        }

        // Flood Guide (if completed flood module)
        if (completedModule.disasterType === 'Flood') {
            await Achievement.findOneAndUpdate(
                { user: userId, achievementType: 'flood_guide' },
                {
                    user: userId,
                    achievementType: 'flood_guide',
                    name: 'Flood Guide',
                    description: 'Successfully mastered the Flood Preparedness module.',
                    badgeIcon: 'fa-water',
                    unlockedAt: new Date()
                },
                { upsert: true, new: true }
            );
        }
    } catch (err) {
        console.error('Module achievement error:', err.message);
    }
}

module.exports = { getModules, getModule, createModule, updateModule, deleteModule, trackProgress, getMyProgress, startProgress };
