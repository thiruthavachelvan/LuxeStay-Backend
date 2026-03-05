const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['admin', 'resident', 'driver', 'cook', 'room-service', 'plumber', 'cleaner'],
        default: 'resident',
    },
    fullName: {
        type: String,
        required: false
    },
    phoneNumber: {
        type: String,
        required: false
    },
    loyaltyPoints: {
        type: Number,
        default: 0
    },
    membershipTier: {
        type: String,
        enum: ['None', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Black Card'],
        default: 'None'
    },
    membership: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Membership',
        required: false
    },
    avatar: {
        type: String,
        default: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80'
    },
    preferences: {
        dietary: { type: String, enum: ['Veg', 'Non-Veg', 'Vegan'], default: 'Veg' },
        roomType: { type: String, default: 'Suite' }
    },
    location: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location',
        required: false
    },
    staffPassword: {
        type: String,
        required: false
    },
    resetPasswordOtp: {
        type: String,
        required: false
    },
    resetPasswordOtpExpire: {
        type: Date,
        required: false
    }
}, { timestamps: true });

// Password hashing middleware
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
