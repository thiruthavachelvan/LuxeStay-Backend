const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    city: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Active', 'Coming Soon'],
        default: 'Active'
    },
    rooms: {
        type: Number,
        required: true,
        default: 0
    },
    category: {
        type: String,
        enum: ['India', 'International'],
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Location', locationSchema);
