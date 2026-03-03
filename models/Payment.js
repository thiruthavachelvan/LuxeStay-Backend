const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: false  // Optional — food orders don't have a booking reference
    },
    foodOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodOrder',
        required: false  // Optional — links to a food order if it exists
    },
    tableReservation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TableReservation',
        required: false  // Optional — links to a dining table reservation
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    method: {
        type: String,
        required: true  // Allow any string value (e.g. 'Card', 'Room Bill', etc.)
    },
    status: {
        type: String,
        enum: ['Success', 'Failed', 'Pending'],
        default: 'Success'
    },
    transactionId: {
        type: String,
        unique: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);
