const mongoose = require('mongoose');

const tableReservationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    guests: {
        type: Number,
        required: true,
        min: 1,
        max: 20
    },
    specialRequests: {
        type: String,
        default: ''
    },
    preBookedMeals: [
        {
            menuItem: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'MenuItem'
            },
            quantity: {
                type: Number,
                default: 1
            }
        }
    ],
    totalPreBookedAmount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Complimentary'],
        default: 'Pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('TableReservation', tableReservationSchema);
