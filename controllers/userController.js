const User = require('../models/User');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const FoodOrder = require('../models/FoodOrder');
const Payment = require('../models/Payment');
const emailService = require('../utils/emailService');

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password').populate('location', 'city');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.fullName = req.body.fullName || user.fullName;
            user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
            user.preferences = req.body.preferences || user.preferences;

            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                email: updatedUser.email,
                fullName: updatedUser.fullName,
                role: updatedUser.role,
                phoneNumber: updatedUser.phoneNumber,
                loyaltyPoints: updatedUser.loyaltyPoints,
                preferences: updatedUser.preferences,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get my bookings
// @route   GET /api/auth/my-bookings
// @access  Private
exports.getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .populate('location', 'city image')
            .populate('room', 'roomType roomNumber')
            .sort({ checkIn: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Cancel booking with tiered refund calculation
// @route   PUT /api/auth/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('room', 'price');

        if (!booking || booking.user.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'Booking not found or unauthorized' });
        }

        if (booking.status === 'Cancelled') {
            return res.status(400).json({ message: 'Booking is already cancelled' });
        }

        /* ── Tiered refund calculation ───────────────────────────────────────
         *  Advance-payment (25%) bookings → non-refundable
         *  Full-payment bookings:
         *    Immediate (same day as booking)  → 75 % refund
         *    > 2 days before check-in         → 50 % refund
         *    1 day before check-in            → 25 % refund
         *    On / after check-in date         → 0 % refund
         * ─────────────────────────────────────────────────────────────────── */
        const now = new Date();
        const checkIn = new Date(booking.checkIn);
        const createdAt = new Date(booking.createdAt);

        // Days from NOW to check-in (negative if already passed)
        const daysToCheckIn = Math.floor((checkIn - now) / (1000 * 60 * 60 * 24));
        // Hours since booking was created
        const hoursSinceBooking = (now - createdAt) / (1000 * 60 * 60);

        const isAdvancePayment = booking.paymentStatus === 'Advance Paid';
        let refundPercentage = 0;

        if (!isAdvancePayment) {
            if (hoursSinceBooking < 24 && daysToCheckIn > 0) {
                refundPercentage = 75; // Cancelled immediately after booking
            } else if (daysToCheckIn > 2) {
                refundPercentage = 50; // More than 2 days before check-in
            } else if (daysToCheckIn === 1) {
                refundPercentage = 25; // 1 day before check-in
            } else {
                refundPercentage = 0;  // On/after check-in date
            }
        }

        const paidAmount = booking.totalPrice || 0;
        const refundAmount = Math.round((paidAmount * refundPercentage) / 100);

        booking.status = 'Cancelled';
        booking.refundAmount = refundAmount;
        booking.refundPercentage = refundPercentage;
        booking.cancelledAt = now;
        const updatedBooking = await booking.save();

        // Notify admin
        await Notification.create({
            type: 'System',
            message: `Booking ${booking._id} cancelled. Refund: ₹${refundAmount} (${refundPercentage}% of ₹${paidAmount}).`,
            status: 'Urgent'
        });

        // Trigger Cancellation Email (Async)
        const populatedBooking = await Booking.findById(booking._id).populate('user', 'fullName email');
        emailService.sendCancellationEmail(populatedBooking);

        res.json({
            ...updatedBooking.toObject(),
            refundAmount,
            refundPercentage,
            isAdvancePayment,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Settle outstanding folio balance via Razorpay
// @route   PUT /api/auth/bookings/:id/settle-folio
// @access  Private
exports.settleBookingFolio = async (req, res) => {
    try {
        const { amount, transactionId, method = 'Razorpay' } = req.body;
        const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id })
            .populate('location');

        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (booking.paymentStatus === 'Paid') {
            return res.status(400).json({ message: 'Booking is already paid in full.' });
        }

        const Payment = require('../models/Payment'); // Lazy load

        // Record the new successful payment
        const paymentRecord = await Payment.create({
            user: req.user._id,
            booking: booking._id,
            amount: amount,
            method: method,
            transactionId: transactionId || `txn_${Date.now()}`,
            status: 'Success'
        });

        // Update the booking status
        booking.paymentStatus = 'Paid';
        await booking.save();

        const Notification = require('../models/Notification');
        await Notification.create({
            user: booking.user,
            type: 'System',
            message: `Payment of ₹${amount} received. Folio for booking at ${booking.location.city} is fully settled.`,
            status: 'Success'
        });

        res.json({ message: 'Folio settled successfully', payment: paymentRecord, booking });
    } catch (error) {
        console.error('Settle Folio Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get my payment history
// @route   GET /api/auth/payment-history
// @access  Private
exports.getPaymentHistory = async (req, res) => {
    try {
        const Payment = require('../models/Payment'); // Lazy load to avoid circular deps if any
        const payments = await Payment.find({ user: req.user._id })
            .populate({
                path: 'booking',
                populate: { path: 'location', select: 'city' }
            })
            .populate('tableReservation')
            .sort({ createdAt: -1 });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all bookings for admin
// @route   GET /api/auth/admin/bookings
// @access  Private/Admin
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('user', 'fullName email')
            .populate('location', 'city')
            .populate('room', 'roomType roomNumber')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Place a food order
// @route   POST /api/auth/food-order
// @access  Private
exports.placeFoodOrder = async (req, res) => {
    try {
        const { items, totalAmount, transactionId } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'No items in the order' });
        }

        // Lookup active booking to associate location
        const Booking = require('../models/Booking');
        const activeBooking = await Booking.findOne({
            user: req.user._id,
            status: { $in: ['CheckedIn', 'Confirmed'] }
        }).sort({ checkIn: 1 });

        // Create the Food Order
        const newOrder = new FoodOrder({
            user: req.user._id,
            items,
            totalAmount,
            status: 'Pending',
            location: activeBooking ? activeBooking.location : null
        });

        const savedOrder = await newOrder.save();

        // Create associated Payment record (Success if transactionId exists, else Pending room bill)
        const payment = new Payment({
            user: req.user._id,
            amount: totalAmount,
            method: transactionId ? 'Online / Razorpay' : 'Pending - Room Bill',
            status: transactionId ? 'Success' : 'Pending',
            foodOrder: savedOrder._id,
            transactionId: transactionId || `FOOD-${savedOrder._id.toString().slice(-8).toUpperCase()}`,
        });

        await payment.save();

        savedOrder.payment = payment._id;
        await savedOrder.save();

        // Notify Admin
        await Notification.create({
            type: 'System',
            message: `New Food Order placed for ₹${totalAmount}.`,
            status: 'Info'
        });

        res.status(201).json(savedOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user's food orders
// @route   GET /api/auth/food-order
// @access  Private
exports.getFoodOrders = async (req, res) => {
    try {
        const orders = await FoodOrder.find({ user: req.user._id })
            .populate('items.menuItem', 'name price image')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get orders assigned to this staff member
// @route   GET /api/auth/staff/food-orders
// @access  Private (Staff)
exports.getMyAssignedOrders = async (req, res) => {
    try {
        const orders = await FoodOrder.find({ assignedTo: req.user._id })
            .populate('user', 'email')
            .populate('items.menuItem', 'name price image')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Staff marks an assigned order as Delivered
// @route   PUT /api/auth/staff/food-orders/:id/complete
// @access  Private (Staff)
exports.completeMyOrder = async (req, res) => {
    try {
        const order = await FoodOrder.findOne({ _id: req.params.id, assignedTo: req.user._id });
        if (!order) {
            return res.status(404).json({ message: 'Order not found or not assigned to you' });
        }

        order.status = 'Delivered';
        await order.save();

        // Notify user that order was delivered
        await Notification.create({
            type: 'Order',
            category: 'food-order',
            recipientRole: 'user',
            message: `Your food order #${order._id.toString().slice(-6).toUpperCase()} has been delivered. Enjoy your meal!`,
            user: order.user,
            status: 'Success'
        });

        // Notify admin that order was delivered
        await Notification.create({
            type: 'Order',
            category: 'food-order',
            recipientRole: 'admin',
            message: `Food Order #${order._id.toString().slice(-6).toUpperCase()} has been delivered by ${req.user.fullName}.`,
            status: 'Info'
        });

        // Trigger Order Delivered Email (Async)
        emailService.sendOrderDeliveredEmail(order, order.user);

        const updatedOrderFull = await FoodOrder.findById(order._id)
            .populate('user', 'email')
            .populate('items.menuItem', 'name price image');

        res.json({ message: 'Order marked as delivered', order: updatedOrder });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user notifications
// @route   GET /api/auth/notifications
// @access  Private
exports.getUserNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            user: req.user._id,
            recipientRole: 'user'
        })
            .sort({ createdAt: -1 })
            .limit(20);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark user notification as read
// @route   PUT /api/auth/notifications/:id/read
// @access  Private
exports.markUserNotificationRead = async (req, res) => {
    try {
        const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
        if (notification) {
            notification.isRead = true;
            await notification.save();
            res.json(notification);
        } else {
            res.status(404).json({ message: 'Notification not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Clear user notifications
// @route   DELETE /api/auth/notifications/clear
// @access  Private
exports.clearUserNotifications = async (req, res) => {
    try {
        await Notification.deleteMany({ user: req.user._id });
        res.json({ message: 'Notifications cleared successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new booking
// @route   POST /api/auth/bookings
// @access  Private
exports.createBooking = async (req, res) => {
    try {
        const { roomId, locationId, checkIn, checkOut, guests, guestDetails, specialRequests, totalPrice, paymentStatus, paymentMethod, transactionId, addOns } = req.body;

        const booking = new Booking({
            user: req.user._id,
            room: roomId,
            location: locationId,
            checkIn,
            checkOut,
            guests,
            guestDetails,
            specialRequests,
            totalPrice,
            paymentStatus,
            addOns: addOns || [],
            status: 'Confirmed'
        });

        const createdBooking = await booking.save();

        if (paymentStatus === 'Paid' || paymentStatus === 'Advance Paid') {
            const amount = paymentStatus === 'Advance Paid' ? totalPrice * 0.25 : totalPrice;
            const payment = new Payment({
                user: req.user._id,
                booking: createdBooking._id,
                amount,
                method: paymentMethod || 'Card',
                status: 'Success',
                transactionId: transactionId || `TXN-${Date.now()}`
            });
            await payment.save();
        }

        // Notify User
        await Notification.create({
            user: req.user._id,
            recipientRole: 'user',
            type: 'System',
            message: `Your booking has been confirmed.`
        });

        // Notify Admin
        await Notification.create({
            user: req.user._id,
            recipientRole: 'admin',
            type: 'New Booking',
            message: `New booking received.`,
            status: 'Info'
        });

        // Trigger Booking Confirmation Email (Async)
        const populatedBooking = await Booking.findById(createdBooking._id)
            .populate({
                path: 'user',
                select: 'fullName email phoneNumber membershipTier membership',
                populate: { path: 'membership' }
            })
            .populate('location', 'city name')
            .populate('room', 'type name');
        emailService.sendBookingConfirmation(populatedBooking);

        res.status(201).json(createdBooking);
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Check-in a booking
// @route   PUT /api/auth/bookings/:id/check-in
// @access  Private
exports.checkInBooking = async (req, res) => {
    try {
        const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        if (booking.status !== 'Confirmed') {
            return res.status(400).json({ message: 'Only confirmed bookings can be checked in.' });
        }

        booking.status = 'CheckedIn';
        await booking.save();

        await Notification.create({
            user: req.user._id,
            recipientRole: 'user',
            type: 'System',
            message: `You have successfully checked in for booking #${booking._id.toString().slice(-6)}. Enjoy your stay!`
        });

        // Notify Admin
        await Notification.create({
            user: req.user._id,
            recipientRole: 'admin',
            type: 'Staff Alert',
            message: `Guest ${req.user.fullName || req.user.email} checked in to booking #${booking._id.toString().slice(-6)}.`
        });

        res.json({ message: 'Checked in successfully', booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Check-out a booking
// @route   PUT /api/auth/bookings/:id/check-out
// @access  Private
exports.checkOutBooking = async (req, res) => {
    try {
        const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        if (booking.status !== 'CheckedIn') {
            return res.status(400).json({ message: 'Only checked-in bookings can be checked out.' });
        }

        booking.status = 'CheckedOut';
        await booking.save();

        await Notification.create({
            user: req.user._id,
            recipientRole: 'user',
            type: 'System',
            message: `You have successfully checked out of booking #${booking._id.toString().slice(-6)}. Don't forget to leave a review!`
        });

        // Notify Admin
        await Notification.create({
            user: req.user._id,
            recipientRole: 'admin',
            type: 'Staff Alert',
            message: `Guest ${req.user.fullName || req.user.email} checked out of booking #${booking._id.toString().slice(-6)}.`
        });

        res.json({ message: 'Checked out successfully', booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update guest details and special requests for a booking
// @route   PUT /api/auth/bookings/:id/guest-details
// @access  Private
exports.saveGuestDetails = async (req, res) => {
    try {
        const { guestDetails, specialRequests } = req.body;
        const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (guestDetails) booking.guestDetails = guestDetails;
        if (specialRequests !== undefined) booking.specialRequests = specialRequests;

        const updatedBooking = await booking.save();
        res.json(updatedBooking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark an amenity as used
// @route   PUT /api/auth/bookings/:id/amenities/:amenityName/use
// @access  Private
exports.updateAmenityUsage = async (req, res) => {
    try {
        const { id, amenityName } = req.params;
        const booking = await Booking.findOne({ _id: id, user: req.user._id });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        const amenity = booking.addOns.find(a => a.name === amenityName);
        if (!amenity) {
            return res.status(404).json({ message: 'Amenity not found in this booking' });
        }

        if (amenity.usageStatus === 'used') {
            return res.status(400).json({ message: 'Amenity already used' });
        }

        amenity.usageStatus = 'used';
        await booking.save();

        res.json({ message: `${amenityName} marked as used`, booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add spa to an existing booking
// @route   PUT /api/auth/bookings/:id/add-spa
// @access  Private
exports.addSpaToBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, transactionId } = req.body;
        const booking = await Booking.findOne({ _id: id, user: req.user._id })
            .populate('user', 'fullName email')
            .populate('location', 'city');

        console.log('--- ADD SPA DEBUG ---');
        console.log('Booking found:', !!booking);
        if (!booking) {
            console.log('No booking found for ID:', id, 'and User:', req.user._id);
            return res.status(404).json({ message: 'Booking not found' });
        }
        console.log('User:', booking.user?.email);
        console.log('Amount:', amount);

        const hasSpa = booking.addOns.some(a => a.name.toLowerCase().includes('spa'));

        if (!hasSpa) {
            console.log('Adding new Spa add-on to booking...');
            // Add spa to addOns
            booking.addOns.push({
                name: 'Spa Session (60 min)',
                price: amount,
                usageStatus: 'unused'
            });

            // Update total price
            booking.totalPrice += amount;
            await booking.save();
        } else {
            console.log('Spa add-on already exists, proceeding to create Support Request only.');
        }

        // Record payment
        const payment = new Payment({
            user: req.user._id,
            booking: booking._id,
            amount,
            method: 'Online / Razorpay',
            status: 'Success',
            transactionId: transactionId || `SPA-${Date.now()}`
        });
        await payment.save();

        console.log('Support Query Creating...');
        const Support = require('../models/Support');
        const supportQuery = await Support.create({
            user: booking.user._id,
            location: booking.location?._id,
            booking: booking._id,
            subject: 'Spa Appointment Request',
            message: `Payment received for Spa Session (₹${amount}). Please coordinate with guest ${booking.user.fullName || booking.user.email} (Booking #${booking._id.toString().slice(-6)}) to schedule their appointment.`,
            status: 'Open',
            priority: 'Urgent'
        });
        console.log('Support Query Created:', supportQuery._id);

        const { sendSpaPurchaseEmail } = require('../utils/emailService');
        await sendSpaPurchaseEmail(booking.user, booking, amount, payment.transactionId);
        console.log('Email Sent (Triggered)');

        // Notify Admin
        console.log('Admin Notification Creating...');
        const Notification = require('../models/Notification');
        await Notification.create({
            type: 'Service Request',
            category: 'query',
            recipientRole: 'admin',
            message: `New Spa Appointment Request from ${booking.user.email || 'Guest'} (Booking #${booking._id.toString().slice(-6)})`,
            status: 'Urgent'
        });
        console.log('Admin Notification Created');

        await Notification.create({
            user: req.user._id,
            recipientRole: 'user',
            type: 'System',
            message: `Spa treatment added to your booking #${booking._id.toString().slice(-6)}. You have been emailed the bill. Our team will contact you for scheduling.`
        });
        console.log('User Notification Created');

        res.json({ message: 'Spa added successfully', booking });
    } catch (error) {
        console.error('ADD SPA ERROR:', error);
        res.status(500).json({ message: error.message });
    }
};
