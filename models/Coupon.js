const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    discountType: {
        type: String,
        enum: ['percent', 'flat'],
        required: true
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0
    },
    maxUses: {
        type: Number,
        default: null // null = unlimited
    },
    usedCount: {
        type: Number,
        default: 0
    },
    minOrderValue: {
        type: Number,
        default: 0
    },
    expiresAt: {
        type: Date,
        default: null // null = never expires
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    featuredTitle: {
        type: String,
        default: ''
    },
    featuredSubtitle: {
        type: String,
        default: ''
    },
    featuredDescription: {
        type: String,
        default: ''
    },
    featuredTag: {
        type: String,
        default: ''
    },
    featuredImage: {
        type: String,
        default: ''
    },
    featuredColor: {
        type: String,
        default: 'from-blue-900/60 to-[#0F1626]'
    },
    appliesTo: {
        type: String,
        enum: ['all', 'booking', 'membership'],
        default: 'all'
    }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
