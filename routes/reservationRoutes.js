const express = require('express');
const router = express.Router();
const TableReservation = require('../models/TableReservation');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');

// Get all reservations for the logged-in user
router.get('/my-reservations', protect, async (req, res) => {
    try {
        const reservations = await TableReservation.find({ user: req.user._id })
            .populate('preBookedMeals.menuItem')
            .sort({ date: 1, time: 1 });
        res.json(reservations);
    } catch (error) {
        console.error("Error fetching user reservations:", error);
        res.status(500).json({ message: 'Server error retrieving reservations' });
    }
});

// Create a new table reservation
router.post('/', protect, async (req, res) => {
    try {
        const { date, time, guests, specialRequests, preBookedMeals, totalPreBookedAmount } = req.body;

        const newReservation = new TableReservation({
            user: req.user._id,
            date,
            time,
            guests,
            specialRequests,
            preBookedMeals,
            totalPreBookedAmount,
            paymentStatus: req.body.transactionId ? 'Paid' : (totalPreBookedAmount > 0 ? 'Pending' : 'Complimentary')
        });

        const savedReservation = await newReservation.save();

        if (req.body.transactionId && totalPreBookedAmount > 0) {
            await Payment.create({
                user: req.user._id,
                tableReservation: savedReservation._id,
                amount: totalPreBookedAmount,
                method: 'Razorpay',
                transactionId: req.body.transactionId,
                status: 'Success'
            });
        }

        // Notify Admin (non-blocking)
        try {
            await Notification.create({
                type: 'Reservation',
                category: 'booking',
                recipientRole: 'admin',
                message: `New table reservation request for ${guests} guests on ${date} at ${time}.`,
                user: req.user._id,
                status: 'Info'
            });
        } catch (notifErr) {
            console.error('Admin notification failed (non-blocking):', notifErr.message);
        }

        res.status(201).json(savedReservation);
    } catch (error) {
        console.error("Error creating reservation:", error);
        res.status(500).json({ message: 'Server error creating reservation' });
    }
});

module.exports = router;
