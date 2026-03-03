const mongoose = require('mongoose');

const foodOrderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    location: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location'
    },
    items: [{
        menuItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MenuItem',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        priceAtOrder: {
            type: Number,
            required: true
        }
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Assigned', 'Preparing', 'Delivered', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'  // References the User model (staff are users with a role)
    }
}, { timestamps: true });

module.exports = mongoose.model('FoodOrder', foodOrderSchema);
