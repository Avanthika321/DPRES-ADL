const Module = require('../models/Module');

// @desc    Get all modules
// @route   GET /api/modules
// @access  Protected
const getModules = async (req, res) => {
    try {
        const modules = await Module.find({}).populate('createdBy', 'name');
        res.json(modules);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a module
// @route   POST /api/modules
// @access  Protected (Teacher/Admin)
const createModule = async (req, res) => {
    console.log('✅ MODULE CREATION REQUEST RECEIVED');
    console.log('req.body:', req.body);
    console.log('req.user:', req.user);
    
    const { title, fileName } = req.body;

    // Safety check: ensure user is authenticated
    if (!req.user) {
        console.log('❌ User not authenticated');
        return res.status(401).json({ message: 'User must be authenticated to create a module' });
    }

    // Validation
    if (!title) {
        console.log('❌ Title is missing');
        return res.status(400).json({ message: 'Title is required' });
    }

    try {
        // Use authenticated user's ID - NO FALLBACK
        const module = new Module({
            title,
            fileName,
            createdBy: req.user._id
        });

        const createdModule = await module.save();
        console.log('✅ Module created successfully:', createdModule);
        console.log('✓ Created by user:', req.user._id);
        res.status(201).json(createdModule);

    } catch (error) {
        console.error('❌ Module creation error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// const createModule = async (req, res) => {
//     const { title, disasterType, content } = req.body;

//     try {
//         const module = new Module({
//             title,
//             disasterType,
//             content,
//             createdBy: req.user._id
//         });

//         const createdModule = await module.save();
//         res.status(201).json(createdModule);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

module.exports = { getModules, createModule };
