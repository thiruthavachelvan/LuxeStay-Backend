const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['User Login', 'New Booking', 'Staff Alert', 'System', 'Service Request', 'Order', 'Reservation']
    },
    category: {
        type: String,
        enum: ['booking', 'query', 'assignment', 'acceptance', 'login', 'completion', 'food-order', 'contact'],
        required: false
    },
    recipientRole: {
        type: String,
        enum: ['admin', 'staff', 'user'],
        default: 'admin'
    },
    message: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['Info', 'Urgent', 'Success'],
        default: 'Info'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
