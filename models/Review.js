const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    location: {
        type: String,
        required: true
    },
    overallRating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    categoryRatings: {
        cleanliness: { type: Number, min: 1, max: 5 },
        service: { type: Number, min: 1, max: 5 },
        location: { type: Number, min: 1, max: 5 },
        foodQuality: { type: Number, min: 1, max: 5 },
        valueForMoney: { type: Number, min: 1, max: 5 }
    },
    comment: {
        type: String,
        required: true,
        maxlength: 1000
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Approved' // Auto-approve for now
    }
}, {
    timestamps: true
});

// One review per booking
reviewSchema.index({ booking: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
