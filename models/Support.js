const mongoose = require('mongoose');

const supportSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    location: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location'
    },
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    },
    subject: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Open', 'Assigned', 'Accepted', 'In Progress', 'Completed', 'Resolved'],
        default: 'Open'
    },
    priority: {
        type: String,
        enum: ['Urgent', 'Standard', 'General'],
        default: 'Standard'
    },
    adminResponse: {
        type: String
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    acceptedAt: { type: Date },
    completedAt: { type: Date }
}, {
    timestamps: true
});

module.exports = mongoose.model('Support', supportSchema);
