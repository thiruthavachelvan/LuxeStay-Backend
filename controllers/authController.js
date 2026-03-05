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
    const { email, password, fullName } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'Member already exists' });
        }

        const user = await User.create({
            email,
            password,
            fullName,
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

// @desc    Forgot Password - Send OTP
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            // Return truthy to prevent email enumeration, but with a warning.
            return res.status(200).json({ message: 'If an account with that email exists, an OTP has been sent.' });
        }

        // Generate a 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP and expiration (10 minutes)
        user.resetPasswordOtp = otp;
        user.resetPasswordOtpExpire = Date.now() + 10 * 60 * 1000;
        await user.save();

        // Send Email
        try {
            await emailService.sendPasswordResetOTPEmail(user, otp);
            res.status(200).json({ message: 'OTP sent to your email.' });
        } catch (emailError) {
            user.resetPasswordOtp = undefined;
            user.resetPasswordOtpExpire = undefined;
            await user.save();

            console.error('Email send failed', emailError);
            return res.status(500).json({ message: 'Email could not be sent' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user || user.resetPasswordOtp !== otp || user.resetPasswordOtpExpire < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        // OTP is valid. Generate a temporary "reset token" to allow password change
        // This token is valid for 15 minutes.
        const resetToken = jwt.sign({ id: user._id, resetAllowed: true }, process.env.JWT_SECRET, { expiresIn: '15m' });

        res.status(200).json({
            message: 'OTP verified successfully.',
            resetToken
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
        return res.status(400).json({ message: 'Reset token and new password are required' });
    }

    try {
        // Verify the reset token
        const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);

        if (!decoded.resetAllowed) {
            return res.status(401).json({ message: 'Invalid reset token' });
        }

        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Set the new password
        user.password = newPassword;
        // Optionally update staff password representation if applicable (or just stick to hashed password)
        if (user.role && ['admin', 'driver', 'cook', 'room-service', 'plumber', 'cleaner'].includes(user.role)) {
            user.staffPassword = newPassword;
        }

        // Clear OTP fields
        user.resetPasswordOtp = undefined;
        user.resetPasswordOtpExpire = undefined;

        await user.save();

        // Send success email
        emailService.sendPasswordResetSuccessEmail(user).catch(err => console.error(`Failed to send reset success email`, err));

        res.status(200).json({ message: 'Password has been successfully reset.' });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Reset token expired. Please request a new OTP.' });
        }
        res.status(500).json({ message: error.message });
    }
};
