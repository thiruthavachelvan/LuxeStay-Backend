const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Breakfast', 'Chef\'s Specials', 'Lunch', 'Dinner', 'Desserts', 'Beverages', 'Bar Menu', 'In-Room Dining', 'Weekend Buffet']
    },
    dietaryType: {
        type: String,
        enum: ['Veg', 'Non-Veg', 'Vegan'],
        default: 'Veg'
    },
    isComplimentary: {
        type: Boolean,
        default: false
    },
    isSpecial: {
        type: Boolean,
        default: false
    },
    image: {
        type: String
    },
    availableAt: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location'
    }],
    calories: {
        type: Number
    },
    preparationTime: {
        type: String // e.g., '15 mins'
    }
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
