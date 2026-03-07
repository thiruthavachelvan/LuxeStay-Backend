const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                console.error(`Auth Error: User not found for ID ${decoded.id}`);
                return res.status(401).json({ message: 'User no longer exists' });
            }

            return next();
        } catch (error) {
            console.error('JWT Verification Fail:', error.message, '| Secret length:', process.env.JWT_SECRET?.length || 0);
            return res.status(401).json({ message: 'Not authorized, session expired' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, missing session token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role && req.user.role.toLowerCase() === 'admin') {
        next();
    } else {
        console.warn(`Admin Access Denied: User ${req.user?.email} has role ${req.user?.role}`);
        res.status(401).json({ message: 'Administrative clearance required' });
    }
};

const optionalProtect = async (req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
        } catch (error) {
            console.error('Optional JWT Verification Error:', error.message);
        }
    }
    next();
};

module.exports = { protect, admin, optionalProtect };
