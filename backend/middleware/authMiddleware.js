const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    console.log('🔐 Protect middleware called');
    console.log('Authorization header:', req.headers.authorization);

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];
            console.log('✓ Token extracted:', token.substring(0, 20) + '...');

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('✓ Token verified, user ID:', decoded.id);

            // Get user from the token and attach to request (excluding password)
            req.user = await User.findById(decoded.id).select('-password');
            console.log('✓ User attached to request:', req.user?.email);

            // Call next() to proceed to the controller
            return next();
        } catch (error) {
            console.error('❌ Token verification failed:', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    // If no token found
    console.error('❌ No token provided');
    return res.status(401).json({ message: 'Not authorized, no token' });
};

module.exports = { protect };
