const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password, role, standard, section } = req.body;

    try {
        const normalizedEmail = email.toLowerCase();
        const userExists = await User.findOne({ email: normalizedEmail });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email: normalizedEmail,
            password,
            role,
            standard: standard || '',
            section: section || ''
        });

        if (user) {
            res.status(201).json({
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    standard: user.standard,
                    section: user.section
                },
                token: generateToken(user._id)
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const normalizedEmail = email.toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        // Logic to satisfy the 3-state requirement:
        // 1. Wrong Username + Password provided = "Invalid username and password"
        // 2. Wrong Username + No Password = "Invalid username"
        // 3. Correct Username + Wrong Password = "Invalid password"

        if (!user) {
            console.log(`❌ Login Failed: User ${email} not found.`);

            // Case 1: No password provided -> "Invalid username"
            if (!password || password.trim() === '') {
                return res.status(401).json({ message: 'Invalid email' });
            }

            // Check if this password matches ANY other user in the system
            const allUsers = await User.find({});
            let passwordExistsInSystem = false;
            for (const u of allUsers) {
                if (await u.matchPassword(password)) {
                    passwordExistsInSystem = true;
                    break;
                }
            }

            if (passwordExistsInSystem) {
                // Password is correct for SOMEONE, but the username is wrong
                return res.status(401).json({ message: 'Invalid email' });
            } else {
                // Username is wrong AND the password doesn't match anyone else either
                return res.status(401).json({ message: 'Invalid email and password' });
            }
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        console.log(`✅ Login Success: ${email}`);
        res.json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                standard: user.standard,
                section: user.section
            },
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error('🔥 Login Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify JWT token
// @route   GET /api/auth/verify
// @access  Protected
const verifyToken = async (req, res) => {
    try {
        // If middleware passed, token is valid
        res.json({
            valid: true,
            user: {
                _id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                standard: req.user.standard,
                section: req.user.section
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

module.exports = { registerUser, loginUser, verifyToken };
