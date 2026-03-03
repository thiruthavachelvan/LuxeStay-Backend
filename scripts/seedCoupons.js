const mongoose = require('mongoose');
const Coupon = require('../models/Coupon');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const coupons = [
    {
        code: 'WELCOME10',
        description: '10% off for first-time room bookings',
        discountType: 'percent',
        discountValue: 10,
        minOrderValue: 2000,
        appliesTo: 'booking',
        isActive: true,
        expiresAt: new Date('2026-12-31')
    },
    {
        code: 'MEMBERSHIP20',
        description: '20% off for membership upgrades',
        discountType: 'percent',
        discountValue: 20,
        minOrderValue: 0,
        appliesTo: 'membership',
        isActive: true,
        expiresAt: new Date('2026-12-31')
    },
    {
        code: 'RESERVE15',
        description: '15% off for restaurant reservations',
        discountType: 'percent',
        discountValue: 15,
        minOrderValue: 1000,
        appliesTo: 'all',
        isActive: true,
        expiresAt: new Date('2026-12-31')
    },
    {
        code: 'SEASONAL25',
        description: '25% off for curated seasonal packages',
        discountType: 'percent',
        discountValue: 25,
        minOrderValue: 5000,
        appliesTo: 'all',
        isActive: true,
        expiresAt: new Date('2026-12-31')
    },
    {
        code: 'LUXE500',
        description: 'Flat ₹500 off on any booking above ₹5000',
        discountType: 'flat',
        discountValue: 500,
        minOrderValue: 5000,
        appliesTo: 'all',
        isActive: true,
        expiresAt: new Date('2026-12-31')
    },
    // ── Offer-page specific coupons ──
    {
        code: 'HONEYMOON25',
        description: 'Honeymoon Bliss package — 25% off Private Pool Rooms',
        discountType: 'percent',
        discountValue: 25,
        minOrderValue: 0,
        appliesTo: 'booking',
        isActive: true,
        expiresAt: new Date('2026-12-31')
    },
    {
        code: 'MONSOON20',
        description: 'Monsoon Escape package — 20% off on seasonal bookings',
        discountType: 'percent',
        discountValue: 20,
        minOrderValue: 0,
        appliesTo: 'booking',
        isActive: true,
        expiresAt: new Date('2026-12-31')
    },
    {
        code: 'CORP15',
        description: 'Corporate Retreat package — 15% off Executive Rooms',
        discountType: 'percent',
        discountValue: 15,
        minOrderValue: 0,
        appliesTo: 'booking',
        isActive: true,
        expiresAt: new Date('2026-12-31')
    }
];

const seedCoupons = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-booking');
        console.log('Connected to MongoDB');

        // Remove existing coupons with same codes to avoid duplicates if re-run
        const codes = coupons.map(c => c.code);
        await Coupon.deleteMany({ code: { $in: codes } });
        console.log('Cleaned up existing coupons');

        await Coupon.insertMany(coupons);
        console.log('Coupons seeded successfully');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding coupons:', error);
        process.exit(1);
    }
};

seedCoupons();
