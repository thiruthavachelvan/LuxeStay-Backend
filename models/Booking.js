const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    location: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location',
        required: true
    },
    checkIn: {
        type: Date,
        required: true
    },
    checkOut: {
        type: Date,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled', 'Completed'],
        default: 'Confirmed'
    },
    guests: {
        adults: { type: Number, default: 1 },
        children: { type: Number, default: 0 }
    },
    guestDetails: [{
        name: { type: String, required: true },
        age: { type: Number, required: true },
        gender: { type: String, required: true },
        phone: { type: String },
        email: { type: String },
        idType: {
            type: String,
            required: function () { return this.type === 'adult'; }
        },
        idNumber: {
            type: String,
            required: function () { return this.type === 'adult'; }
        },
        type: { type: String, enum: ['adult', 'child'], required: true }
    }],
    specialRequests: {
        type: String,
        default: ''
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Advance Paid'],
        default: 'Pending'
    },
    refundAmount: {
        type: Number,
        default: 0
    },
    refundPercentage: {
        type: Number,
        default: 0
    },
    cancelledAt: {
        type: Date
    },
    couponCode: {
        type: String,
        default: null
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    originalPrice: {
        type: Number,
        default: 0
    },
    addOns: [{
        name: { type: String, required: true },
        price: { type: Number, required: true },
        usageStatus: {
            type: String,
            enum: ['unused', 'used'],
            default: 'unused'
        },
        spaSchedule: {
            type: Date,
            default: null
        }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
