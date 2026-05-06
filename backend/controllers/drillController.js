const Drill = require('../models/Drill');
const DrillRegistration = require('../models/DrillRegistration');
const DrillReminder = require('../models/DrillReminder');
const User = require('../models/User');
const Achievement = require('../models/Achievement');

// @desc    Create a new drill
// @route   POST /api/drills
// @access  Protected (Admin)
const createDrill = async (req, res) => {
    const { title, disasterType, scheduledDate, description, targetStandard, targetSection } = req.body;

    try {
        const drill = new Drill({
            title,
            disasterType,
            scheduledDate,
            description,
            targetStandard: targetStandard || '',
            targetSection: targetSection || '',
            createdBy: req.user._id
        });

        const savedDrill = await drill.save();

        // Auto-register students from the target class
        if (targetStandard && targetSection) {
            const students = await User.find({ role: 'student', standard: targetStandard, section: targetSection });
            if (students.length > 0) {
                const registrations = students.map(student => ({
                    user: student._id,
                    drill: savedDrill._id
                }));
                await DrillRegistration.insertMany(registrations);
                savedDrill.participation = students.length;
                await savedDrill.save();
            }
        }

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
        const drills = await Drill.find().populate('createdBy', 'name').sort({ scheduledDate: 1 });

        // If user is a student, attach their registration status to each drill
        if (req.user.role === 'student') {
            const registrations = await DrillRegistration.find({ user: req.user._id });
            const regMap = {};
            registrations.forEach(r => {
                regMap[r.drill.toString()] = { registered: true, participated: r.participated, score: r.score };
            });

            const drillsWithStatus = drills.map(d => {
                const drillObj = d.toObject();
                drillObj.userStatus = regMap[d._id.toString()] || { registered: false, participated: false, score: 0 };
                return drillObj;
            });
            return res.json(drillsWithStatus);
        }

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

// @desc    Update drill
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

// @desc    Delete drill
// @route   DELETE /api/drills/:id
// @access  Protected (Admin)
const deleteDrill = async (req, res) => {
    try {
        const drill = await Drill.findById(req.params.id);
        if (!drill) {
            return res.status(404).json({ message: 'Drill not found' });
        }

        await Drill.findByIdAndDelete(req.params.id);
        await DrillRegistration.deleteMany({ drill: req.params.id });
        res.json({ message: 'Drill deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get next upcoming drill
// @route   GET /api/drills/next
// @access  Protected
const getNextDrill = async (req, res) => {
    try {
        const nextDrill = await Drill.findOne({
            scheduledDate: { $gte: new Date() },
            status: { $in: ['Scheduled', 'Active'] }
        }).sort({ scheduledDate: 1 });

        if (!nextDrill) {
            return res.json({ message: 'No upcoming drills', drill: null });
        }

        res.json(nextDrill);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Register student for a drill
// @route   POST /api/drills/:id/register
// @access  Protected (Student)
const registerForDrill = async (req, res) => {
    try {
        const drill = await Drill.findById(req.params.id);
        if (!drill) {
            return res.status(404).json({ message: 'Drill not found' });
        }

        // Check if already registered
        const existing = await DrillRegistration.findOne({ user: req.user._id, drill: req.params.id });
        if (existing) {
            return res.status(400).json({ message: 'Already registered for this drill' });
        }

        const registration = new DrillRegistration({
            user: req.user._id,
            drill: req.params.id
        });

        await registration.save();

        // Update drill participation count
        const regCount = await DrillRegistration.countDocuments({ drill: req.params.id });
        await Drill.findByIdAndUpdate(req.params.id, { participation: regCount });

        // Drill Registration Achievement (Getting involved)
        const drillCount = await DrillRegistration.countDocuments({ user: req.user._id });
        if (drillCount === 1) {
            await Achievement.findOneAndUpdate(
                { user: req.user._id, achievementType: 'drill_champion' },
                {
                    user: req.user._id,
                    achievementType: 'drill_champion',
                    name: 'Action Ready',
                    description: 'Registered for your first virtual disaster drill.',
                    badgeIcon: 'fa-running',
                    unlockedAt: new Date()
                },
                { upsert: true, new: true }
            );
        }

        res.status(201).json({ message: 'Registered successfully', registration });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get drill participation data (for teacher/admin)
// @route   GET /api/drills/participation
// @access  Protected (Teacher/Admin)
const getDrillParticipation = async (req, res) => {
    try {
        const drills = await Drill.find().sort({ scheduledDate: -1 });
        const participationData = [];

        for (const drill of drills) {
            const registrations = await DrillRegistration.find({ drill: drill._id })
                .populate('user', 'name email');

            participationData.push({
                drill: {
                    _id: drill._id,
                    title: drill.title,
                    disasterType: drill.disasterType,
                    scheduledDate: drill.scheduledDate,
                    status: drill.status
                },
                totalRegistered: registrations.length,
                participated: registrations.filter(r => r.participated).length,
                students: registrations.map(r => ({
                    name: r.user.name,
                    email: r.user.email,
                    participated: r.participated,
                    score: r.score
                }))
            });
        }

        res.json(participationData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Send a participation reminder to all students registered for a drill
// @route   POST /api/drills/:id/remind
// @access  Protected (Teacher/Admin)
const sendDrillReminder = async (req, res) => {
    try {
        const drill = await Drill.findById(req.params.id);
        if (!drill) {
            return res.status(404).json({ message: 'Drill not found' });
        }

        // Get all registered students for this drill
        const registrations = await DrillRegistration.find({ drill: req.params.id })
            .populate('user', 'name email');

        if (registrations.length === 0) {
            return res.status(200).json({
                message: 'No students are registered for this drill yet.',
                count: 0
            });
        }

        const drillDate = new Date(drill.scheduledDate).toLocaleDateString('en-IN', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        const reminderMessage = `📣 Reminder from your teacher: You are registered for the drill "${drill.title}" (${drill.disasterType}) scheduled on ${drillDate}. Please be prepared and attend on time!`;

        // Save a DrillReminder record per student in DB
        const reminderDocs = registrations.map(reg => ({
            student: reg.user._id,
            drill: drill._id,
            message: reminderMessage,
            sentBy: req.user._id,
            isRead: false,
            sentAt: new Date()
        }));

        await DrillReminder.insertMany(reminderDocs);

        console.log(`\n📢 [DRILL REMINDER] Sent by ${req.user.name} for drill: "${drill.title}" to ${registrations.length} student(s)`);

        res.json({
            message: `Reminder successfully sent to ${registrations.length} registered student(s).`,
            count: registrations.length,
            drill: drill.title,
            scheduledDate: drill.scheduledDate,
            students: registrations.map(r => ({ name: r.user.name, email: r.user.email }))
        });
    } catch (error) {
        console.error('Reminder error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all reminders for the logged-in student
// @route   GET /api/drills/my-reminders
// @access  Protected (Student)
const getMyDrillReminders = async (req, res) => {
    try {
        const reminders = await DrillReminder.find({ student: req.user._id })
            .populate('drill', 'title disasterType scheduledDate status')
            .populate('sentBy', 'name')
            .sort({ sentAt: -1 })
            .limit(20);

        res.json(reminders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark a reminder as read
// @route   PATCH /api/drills/reminders/:reminderId/read
// @access  Protected (Student)
const markReminderRead = async (req, res) => {
    try {
        await DrillReminder.findByIdAndUpdate(req.params.reminderId, { isRead: true });
        res.json({ message: 'Reminder marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createDrill, getDrills, getDrill, updateDrill, deleteDrill, getNextDrill, registerForDrill, getDrillParticipation, sendDrillReminder, getMyDrillReminders, markReminderRead };