const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tier: {
        type: String,
        enum: ['Silver', 'Gold', 'Platinum', 'Diamond', 'Black Card'],
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Active', 'Expired', 'Cancelled'],
        default: 'Active'
    },
    razorpayOrderId: {
        type: String
    },
    transactionId: {
        type: String
    },
    benefits: [{
        type: String
    }]
}, { timestamps: true });

module.exports = mongoose.model('Membership', membershipSchema);
