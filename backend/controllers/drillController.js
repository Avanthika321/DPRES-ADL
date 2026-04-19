const Drill = require('../models/Drill');

// @desc    Create a new drill
// @route   POST /api/drills
// @access  Protected (Admin)
const createDrill = async (req, res) => {
    const { title, disasterType, scheduledDate, description } = req.body;

    try {
        const drill = new Drill({
            title,
            disasterType,
            scheduledDate,
            description,
            createdBy: req.user._id
        });

        const savedDrill = await drill.save();
        res.status(201).json(savedDrill);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all drills
// @route   GET /api/drills
// @access  Protected
const getDrills = async (req, res) => {
    try {
        const drills = await Drill.find().populate('createdBy', 'name');
        res.json(drills);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single drill
// @route   GET /api/drills/:id
// @access  Protected
const getDrill = async (req, res) => {
    try {
        const drill = await Drill.findById(req.params.id).populate('createdBy', 'name');
        if (!drill) {
            return res.status(404).json({ message: 'Drill not found' });
        }
        res.json(drill);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update drill status
// @route   PUT /api/drills/:id
// @access  Protected (Admin)
const updateDrill = async (req, res) => {
    try {
        const drill = await Drill.findById(req.params.id);
        if (!drill) {
            return res.status(404).json({ message: 'Drill not found' });
        }

        const updatedDrill = await Drill.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedDrill);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createDrill, getDrills, getDrill, updateDrill };