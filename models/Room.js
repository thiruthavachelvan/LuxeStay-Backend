const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    location: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location',
        required: true
    },
    roomNumber: {
        type: String,
        required: true
    },
    floor: {
        type: String,
        required: true,
        enum: ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor', 'Luxury Wing', 'Location Special']
    },
    type: {
        type: String,
        required: true,
        enum: [
            'Single Room',
            'Double Room',
            'Family Room',
            'Deluxe Room',
            'Executive Room',
            'Honeymoon Suite',
            'Themed Room',
            'Presidential Suite',
            'Accessible Room',
            'Beach-connected Room',
            'Private Pool Room',
            'Exclusive Suite'
        ]
    },
    price: {
        type: Number,
        required: true
    },
    capacity: {
        adults: { type: Number, required: true },
        children: { type: Number, default: 0 }
    },
    amenities: [{ type: String }],
    benefits: [{ type: String }],
    status: {
        type: String,
        enum: ['Available', 'Occupied', 'Maintenance', 'Limited'],
        default: 'Available'
    },
    images: [{ type: String }],
    description: { type: String },
    viewType: { type: String }, // e.g., 'City View', 'Ocean View', 'Garden View'
    bedType: { type: String }, // e.g., 'Single Bed', 'Double Bed', 'King Size'
    area: { type: String }, // e.g., '45 m²'
    luxuryLevel: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
    }
}, { timestamps: true });

// Ensure room numbers are unique within a single location
roomSchema.index({ location: 1, roomNumber: 1 }, { unique: true });

module.exports = mongoose.model('Room', roomSchema);
