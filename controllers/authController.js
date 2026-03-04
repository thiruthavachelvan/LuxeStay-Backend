const User = require('../models/User');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');
const emailService = require('../utils/emailService');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new member
// @route   POST /api/auth/signup
exports.registerUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'Member already exists' });
        }

        const user = await User.create({
            email,
            password,
        });

        if (user) {
            // Trigger Welcome Email (Async)
            emailService.sendWelcomeEmail(user).catch(err => console.error(`Welcome email failed:`, err));

            res.status(201).json({
                _id: user._id,
                email: user.email,
                role: user.role || 'resident',
                fullName: user.fullName,
                phoneNumber: user.phoneNumber,
                loyaltyPoints: user.loyaltyPoints,
                avatar: user.avatar,
                preferences: user.preferences,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid member data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth member & get token
// @route   POST /api/auth/login
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).populate('location', 'city');

        if (user && (await user.matchPassword(password))) {
            // Create login notification for user
            await Notification.create({
                type: 'User Login',
                category: 'login',
                recipientRole: 'user',
                message: `You have successfully signed into your LuxeStay portal.`,
                user: user._id,
                status: 'Info'
            });

            // Create login notification for admins
            await Notification.create({
                type: 'User Login',
                category: 'login',
                recipientRole: 'admin',
                message: `Member ${user.email} has signed into the portal.`,
                user: user._id,
                status: 'Info'
            });

            res.json({
                _id: user._id,
                email: user.email,
                role: user.role || 'resident',
                fullName: user.fullName,
                phoneNumber: user.phoneNumber,
                loyaltyPoints: user.loyaltyPoints,
                avatar: user.avatar,
                preferences: user.preferences,
                location: user.location,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
