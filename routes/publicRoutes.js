const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const Location = require('../models/Location');
const Booking = require('../models/Booking');
const MenuItem = require('../models/MenuItem');
const Coupon = require('../models/Coupon');

// @desc    Get all rooms for homepage with optional date availability check
// @route   GET /api/public/rooms
// @access  Public
router.get('/rooms', async (req, res) => {
    try {
        const { checkIn, checkOut } = req.query;

        let rooms = await Room.find({ status: 'Available' })
            .populate('location', 'city')
            .sort({ luxuryLevel: -1 });

        if (checkIn && checkOut) {
            const inDate = new Date(checkIn);
            const outDate = new Date(checkOut);
            const overlappingBookings = await Booking.find({
                status: { $in: ['Confirmed', 'CheckedIn'] },
                $or: [{ checkIn: { $lt: outDate }, checkOut: { $gt: inDate } }]
            });
            const bookedRoomIds = overlappingBookings.map(b => b.room.toString());
            rooms = rooms.map(room => {
                const isBooked = bookedRoomIds.includes(room._id.toString());
                const roomObj = room.toObject();
                roomObj.status = isBooked ? 'Occupied' : 'Available';
                return roomObj;
            });
        }
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get single room by ID
// @route   GET /api/public/rooms/:id
// @access  Public
router.get('/rooms/:id', async (req, res) => {
    try {
        const room = await Room.findById(req.params.id).populate('location');
        if (!room) return res.status(404).json({ message: 'Room not found' });
        res.json(room);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Check single room availability for dates
// @route   GET /api/public/rooms/:id/availability
// @access  Public
router.get('/rooms/:id/availability', async (req, res) => {
    try {
        const { checkIn, checkOut } = req.query;
        if (!checkIn || !checkOut) {
            return res.status(400).json({ message: 'Check-in and check-out dates are required' });
        }
        const inDate = new Date(checkIn);
        const outDate = new Date(checkOut);
        const overlappingBookings = await Booking.find({
            room: req.params.id,
            status: { $in: ['Confirmed', 'CheckedIn'] },
            $or: [{ checkIn: { $lt: outDate }, checkOut: { $gt: inDate } }]
        });
        res.json({ isAvailable: overlappingBookings.length === 0 });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all locations for homepage
// @route   GET /api/public/locations
// @access  Public
router.get('/locations', async (req, res) => {
    try {
        const locations = await Location.find({});
        res.json(locations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all menu items for the restaurant page
// @route   GET /api/public/menu
// @access  Public
router.get('/menu', async (req, res) => {
    try {
        const menuItems = await MenuItem.find({});
        res.json(menuItems);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get featured coupons for Offers page curated packages
// @route   GET /api/public/coupons/featured
// @access  Public
router.get('/coupons/featured', async (req, res) => {
    try {
        const featured = await Coupon.find({ isFeatured: true, isActive: true }).limit(6);
        res.json(featured);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Validate a coupon code (no auth required)
// @route   GET /api/public/coupons/validate?code=XXX&amount=XXXXX
// @access  Public
router.get('/coupons/validate', async (req, res) => {
    try {
        const { code, amount } = req.query;
        if (!code) return res.status(400).json({ valid: false, message: 'No coupon code provided' });

        const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
        if (!coupon) return res.status(404).json({ valid: false, message: 'Invalid or inactive coupon code' });

        if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
            return res.status(400).json({ valid: false, message: 'This coupon has expired' });
        }

        if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
            return res.status(400).json({ valid: false, message: 'Coupon usage limit has been reached' });
        }

        if (amount && Number(amount) < coupon.minOrderValue) {
            return res.status(400).json({
                valid: false,
                message: `Minimum order value of ₹${coupon.minOrderValue.toLocaleString()} required for this coupon`
            });
        }

        let discountAmount = 0;
        if (coupon.discountType === 'percent') {
            discountAmount = Math.round((Number(amount) || 0) * coupon.discountValue / 100);
        } else {
            discountAmount = coupon.discountValue;
        }

        res.json({
            valid: true,
            code: coupon.code,
            description: coupon.description,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            discountAmount,
            appliesTo: coupon.appliesTo,
            message: coupon.discountType === 'percent'
                ? `${coupon.discountValue}% discount applied!`
                : `₹${coupon.discountValue} flat discount applied!`
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
