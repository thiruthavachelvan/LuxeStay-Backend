const User = require('../models/User');
const Location = require('../models/Location');
const Room = require('../models/Room');
const MenuItem = require('../models/MenuItem');
const Notification = require('../models/Notification');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const emailService = require('../utils/emailService');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Admin creates a staff account
// @route   POST /api/auth/admin/create-staff
// @access  Admin Only (Middleware handled in routes)
exports.createStaffAccount = async (req, res) => {
    try {
        let { fullName, email, password, role, location } = req.body;
        let user; // Declared user variable

        // If location is provided, append it to the email
        if (location) {
            const loc = await Location.findById(location);
            if (loc) {
                const emailParts = email.split('@');
                const locationName = loc.city.toLowerCase().replace(/\s+/g, '');
                email = `${emailParts[0]}.${locationName}@${emailParts[1]}`;
            }
        }

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'Staff member already exists with this email' });
        }

        user = await User.create({
            fullName,
            email,
            password,
            role,
            location: location || null,
            staffPassword: password // Store plain password for admin visibility
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                email: user.email,
                role: user.role,
                location: user.location,
                staffPassword: user.staffPassword,
                message: `${role} account created successfully`
            });
        } else {
            res.status(400).json({ message: 'Invalid staff data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all staff members
// @route   GET /api/auth/admin/staff
// @access  Admin Only
exports.getStaffMembers = async (req, res) => {
    try {
        const { locationId } = req.query;
        const staffRoles = ['driver', 'cook', 'room-service', 'plumber', 'cleaner'];

        let query = { role: { $in: staffRoles } };
        if (locationId && locationId !== 'all') {
            query.location = locationId;
        }

        const staffMembers = await User.find(query)
            .select('-password')
            .populate('location', 'city')
            .sort({ createdAt: -1 });

        res.json(staffMembers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get system wide live stats
// @route   GET /api/auth/admin/stats
// @access  Admin Only
exports.getDashboardStats = async (req, res) => {
    try {
        const { range = 'month' } = req.query;

        const activeStaysCount = await Booking.countDocuments({ status: 'CheckedIn' });
        const upcomingArrivalsCount = await Booking.countDocuments({ status: 'Confirmed' });

        // Sum total residents intelligently by parsing the guests schema object
        // Strictly for currently CheckedIn guests (In-House)
        const checkedInBookings = await Booking.find({ status: 'CheckedIn' }).lean();
        let totalResidents = 0;
        checkedInBookings.forEach(b => {
            const adults = b.guests?.adults || 1;
            const children = b.guests?.children || 0;
            totalResidents += (adults + children);
        });

        // Revenue Calculation based on range
        let revenueStartDate = new Date();
        revenueStartDate.setHours(0, 0, 0, 0);
        if (range === 'year') {
            revenueStartDate.setMonth(0, 1); // Jan 1st
        } else {
            revenueStartDate.setDate(1); // 1st of current month
        }

        const successfulPayments = await Payment.find({
            status: 'Success',
            createdAt: { $gte: revenueStartDate }
        });
        const totalRevenue = successfulPayments.reduce((acc, curr) => acc + curr.amount, 0);

        const staffRoles = ['driver', 'cook', 'room-service', 'plumber', 'cleaner'];
        const activeStaffCount = await User.countDocuments({ role: { $in: staffRoles } });

        // Aggregate Bookings by Location for System Overview (Occupancy = CheckedIn AND Confirmed)
        const locationStats = await Booking.aggregate([
            { $match: { status: { $in: ['CheckedIn', 'Confirmed'] } } },
            { $lookup: { from: 'locations', localField: 'location', foreignField: '_id', as: 'locData' } },
            { $unwind: '$locData' },
            {
                $group: {
                    _id: '$locData._id',
                    city: { $first: '$locData.city' },
                    activeStays: {
                        $sum: { $cond: [{ $eq: ['$status', 'CheckedIn'] }, 1, 0] }
                    },
                    upcomingArrivals: {
                        $sum: { $cond: [{ $eq: ['$status', 'Confirmed'] }, 1, 0] }
                    }
                }
            },
            { $project: { city: 1, activeStays: 1, upcomingArrivals: 1, _id: 1 } },
            { $sort: { activeStays: -1, upcomingArrivals: -1 } }
        ]);

        res.json({
            activeStays: activeStaysCount,
            upcomingArrivals: upcomingArrivalsCount,
            totalResidents: totalResidents,
            totalRevenue: totalRevenue,
            staffOnline: activeStaffCount,
            locationStats: locationStats,
            revenueRange: range
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update staff member
// @route   PUT /api/auth/admin/staff/:id
// @access  Admin Only
exports.updateStaffAccount = async (req, res) => {
    try {
        const staff = await User.findById(req.params.id);
        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found' });
        }

        let { fullName, email, password, role, location } = req.body;

        if (fullName) staff.fullName = fullName;
        if (role) staff.role = role;
        if (location) staff.location = location;

        // If email or location changed, re-process email if it follows the pattern
        if (email || (location && staff.location)) {
            let baseEmail = email || staff.email;
            const locId = location || staff.location;

            if (locId) {
                const loc = await Location.findById(locId);
                if (loc) {
                    const emailParts = baseEmail.split('@');
                    let prefix = emailParts[0];
                    let domain = emailParts[1] || 'luxestays.com'; // Default domain if none

                    // Clean prefix: remove existing location suffix if it was role.city@domain
                    // We look for the last dot before the @
                    const locationName = loc.city.toLowerCase().replace(/\s+/g, '');

                    // Remove any existing location suffix from prefix
                    // e.g., "john.dubai" -> "john"
                    if (prefix.includes('.')) {
                        const parts = prefix.split('.');
                        // If the last part is a known location-like name OR the current one, strip it
                        // For simplicity, let's assume anything after the last dot in our pattern is the location
                        prefix = parts.slice(0, -1).join('.');
                    }

                    staff.email = `${prefix}.${locationName}@${domain}`;
                }
            } else if (email) {
                staff.email = email;
            }
        }

        if (password) {
            staff.staffPassword = password;
            staff.password = password;
        }

        await staff.save();
        res.json({ message: 'Staff updated successfully', staff });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete staff member
// @route   DELETE /api/auth/admin/staff/:id
// @access  Admin Only
exports.deleteStaffMember = async (req, res) => {
    try {
        const staff = await User.findById(req.params.id);
        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found' });
        }
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'Staff member removed from service archive.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin creates a new location
// @route   POST /api/auth/admin/locations
// @access  Admin Only
exports.createLocation = async (req, res) => {
    const { city, description, price, status, rooms, category } = req.body;

    try {
        const location = await Location.create({
            city,
            description,
            price,
            status,
            rooms,
            category
        });

        if (location) {
            res.status(201).json({
                message: 'Hotel location added successfully',
                location
            });
        } else {
            res.status(400).json({ message: 'Invalid location data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all locations
// @route   GET /api/auth/admin/locations
// @access  Admin/Public (Usually Admin to manage, but public to view. We'll use Admin auth for now as per instructions)
exports.getLocations = async (req, res) => {
    try {
        const locations = await Location.find({});
        res.json(locations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a location
// @route   PUT /api/auth/admin/locations/:id
// @access  Admin Only
exports.updateLocation = async (req, res) => {
    try {
        const location = await Location.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }
        res.json({
            message: 'Location updated successfully',
            location
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Update a room
// @route   PUT /api/auth/admin/rooms/:id
// @access  Admin Only
exports.updateRoom = async (req, res) => {
    try {
        const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }
        res.json({
            message: 'Room logistics updated successfully',
            room
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Menu Item Handlers ---

// @desc    Get all menu items
// @route   GET /api/auth/admin/menu
// @access  Admin Only
exports.getMenuItems = async (req, res) => {
    try {
        const { category, locationId } = req.query;
        let query = {};
        if (category && category !== 'All Categories') query.category = category;
        if (locationId) query.availableAt = locationId;

        const items = await MenuItem.find(query).populate('availableAt', 'city');
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a menu item
// @route   POST /api/auth/admin/menu
// @access  Admin Only
exports.createMenuItem = async (req, res) => {
    try {
        const item = await MenuItem.create(req.body);
        res.status(201).json({
            message: 'Menu item integrated successfully',
            item
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a menu item
// @route   PUT /api/auth/admin/menu/:id
// @access  Admin Only
exports.updateMenuItem = async (req, res) => {
    try {
        const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!item) return res.status(404).json({ message: 'Menu item not found' });
        res.json({
            message: 'Culinary profile updated',
            item
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a menu item
// @route   DELETE /api/auth/admin/menu/:id
// @access  Admin Only
exports.deleteMenuItem = async (req, res) => {
    try {
        const item = await MenuItem.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ message: 'Menu item not found' });
        res.json({ message: 'Menu item decommissioned' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin creates a new room
// @route   POST /api/auth/admin/rooms
// @access  Admin Only
exports.createRoom = async (req, res) => {
    try {
        const room = await Room.create(req.body);

        // Update the room count in the corresponding location
        await Location.findByIdAndUpdate(room.location, {
            $inc: { rooms: 1 }
        });

        res.status(201).json({
            message: 'Room established successfully',
            room
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all rooms for a location
// @route   GET /api/auth/admin/rooms/:locationId
// @access  Admin Only
exports.getRoomsByLocation = async (req, res) => {
    try {
        const { locationId } = req.params;
        const { floor } = req.query;

        let query = { location: locationId };
        if (floor && floor !== 'All Floors') {
            query.floor = floor;
        }

        const rooms = await Room.find(query).sort({ roomNumber: 1 });
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Notification Handlers ---

// @desc    Get system notifications
// @route   GET /api/auth/admin/notifications
// @access  Admin Only
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipientRole: 'admin' })
            .sort({ createdAt: -1 })
            .limit(30)
            .populate('user', 'fullName email');
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/auth/admin/notifications/:id
// @access  Admin Only
exports.markNotificationRead = async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );
        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Clear all notifications
// @route   DELETE /api/auth/admin/notifications
// @access  Admin Only
exports.clearNotifications = async (req, res) => {
    try {
        await Notification.deleteMany({});
        res.json({ message: 'Notifications cleared' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Food Order Handlers ---

// @desc    Get all food orders (Admin)
// @route   GET /api/auth/admin/food-orders
// @access  Admin Only
exports.getAdminFoodOrders = async (req, res) => {
    try {
        const FoodOrder = require('../models/FoodOrder'); // Ensure lazy load if not imported at top
        const orders = await FoodOrder.find({})
            .populate('user', 'email')
            .populate('items.menuItem', 'name price image')
            .populate('assignedTo', 'email')
            .populate('location', 'city')
            .populate('payment')
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a food order status / assignment
// @route   PUT /api/auth/admin/food-orders/:id
// @access  Admin Only
exports.updateFoodOrderStatus = async (req, res) => {
    try {
        const { status, assignedTo } = req.body;
        const FoodOrder = require('../models/FoodOrder');

        const order = await FoodOrder.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Food order not found' });
        }

        if (status) order.status = status;
        if (assignedTo) order.assignedTo = assignedTo;

        await order.save();

        // Return updated order with populated fields
        const updatedOrder = await FoodOrder.findById(req.params.id)
            .populate('user', 'email')
            .populate('items.menuItem', 'name price image')
            .populate('assignedTo', 'email role');

        if (assignedTo && updatedOrder.assignedTo) {
            // Notify User
            await Notification.create({
                type: 'Staff Alert',
                category: 'assignment',
                recipientRole: 'user',
                message: `${updatedOrder.assignedTo.role === 'cook' ? 'Cook' : 'Staff'} has been assigned to prepare your food order #${updatedOrder._id.toString().slice(-6).toUpperCase()}`,
                user: updatedOrder.user._id,
                status: 'Info'
            });

            // Notify Staff
            await Notification.create({
                type: 'Staff Alert',
                category: 'assignment',
                recipientRole: 'staff',
                message: `You have been assigned a new food order #${updatedOrder._id.toString().slice(-6).toUpperCase()} from ${updatedOrder.user.email}`,
                user: assignedTo,
                status: 'Info'
            });
        } else if (status === 'Completed' || status === 'Delivered') {
            await Notification.create({
                type: 'Order',
                category: 'completion',
                recipientRole: 'user',
                message: `Your food order #${updatedOrder._id.toString().slice(-6).toUpperCase()} has been ${status.toLowerCase()}.`,
                user: updatedOrder.user._id,
                status: 'Success'
            });

            // Trigger Food Order Delivery Email
            emailService.sendOrderDeliveredEmail(updatedOrder, updatedOrder.user);
        }

        res.json({
            message: 'Food order updated successfully',
            order: updatedOrder
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Table Reservation Handlers ---

// @desc    Get all table reservations (Admin)
// @route   GET /api/auth/admin/reservations
// @access  Admin Only
exports.getAdminReservations = async (req, res) => {
    try {
        const TableReservation = require('../models/TableReservation');
        const reservations = await TableReservation.find({})
            .populate('user', 'email fullName')
            .populate('preBookedMeals.menuItem', 'name price')
            .sort({ createdAt: -1 });

        res.json(reservations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a table reservation status
// @route   PUT /api/auth/admin/reservations/:id
// @access  Admin Only
exports.updateReservationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const TableReservation = require('../models/TableReservation');
        const Notification = require('../models/Notification');

        const reservation = await TableReservation.findById(req.params.id).populate('user', 'email fullName');
        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }

        if (status) reservation.status = status;
        await reservation.save();

        // Try to notify user — don't let this block the response
        if (status === 'Confirmed') {
            try {
                await Notification.create({
                    type: 'Reservation',
                    category: 'booking',
                    recipientRole: 'user',
                    message: `Your table reservation for ${reservation.guests} guests on ${reservation.date} at ${reservation.time} has been confirmed.`,
                    user: reservation.user._id,
                    status: 'Success'
                });
            } catch (notifErr) {
                console.error('Notification creation failed (non-blocking):', notifErr.message);
            }
        }

        res.json({
            message: 'Reservation updated successfully',
            reservation
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Booking Management Handlers (Admin) ---

// @desc    Admin Check-In a booking
// @route   PUT /api/auth/admin/bookings/:id/check-in
// @access  Admin Only
exports.adminCheckInBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('user', 'fullName email');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        booking.status = 'CheckedIn';
        await booking.save();

        await Notification.create({
            user: booking.user._id,
            recipientRole: 'user',
            type: 'System',
            message: `Admin has checked you in for booking #${booking._id.toString().slice(-6)}. Enjoy your stay!`,
            status: 'Success'
        });

        res.json({ message: 'Checked in successfully', booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin Check-Out a booking
// @route   PUT /api/auth/admin/bookings/:id/check-out
// @access  Admin Only
exports.adminCheckOutBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('user', 'fullName email');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        booking.status = 'CheckedOut';
        await booking.save();

        await Notification.create({
            user: booking.user._id,
            recipientRole: 'user',
            type: 'System',
            message: `Admin has checked you out for booking #${booking._id.toString().slice(-6)}. Hope to see you again!`,
            status: 'Info'
        });

        res.json({ message: 'Checked out successfully', booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin Cancel a booking
// @route   PUT /api/auth/admin/bookings/:id/cancel
// @access  Admin Only
exports.adminCancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('user', 'fullName email');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        booking.status = 'Cancelled';
        booking.cancelledAt = new Date();
        await booking.save();

        await Notification.create({
            user: booking.user._id,
            recipientRole: 'user',
            type: 'System',
            message: `Your booking #${booking._id.toString().slice(-6)} has been cancelled by the admin.`,
            status: 'Warning'
        });

        res.json({ message: 'Booking cancelled successfully', booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ── Coupon CRUD ──────────────────────────────────────────
const Coupon = require('../models/Coupon');

exports.getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find({}).sort({ createdAt: -1 });
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createCoupon = async (req, res) => {
    try {
        const { code, description, discountType, discountValue, maxUses, minOrderValue, expiresAt, appliesTo } = req.body;
        const existing = await Coupon.findOne({ code: code.toUpperCase() });
        if (existing) return res.status(400).json({ message: 'Coupon code already exists' });

        const coupon = await Coupon.create({
            code: code.toUpperCase(),
            description,
            discountType,
            discountValue,
            maxUses: maxUses || null,
            minOrderValue: minOrderValue || 0,
            expiresAt: expiresAt || null,
            appliesTo: appliesTo || 'all'
        });
        res.status(201).json(coupon);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
        res.json(coupon);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);
        if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
        res.json({ message: 'Coupon deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ── Admin Notifications ─────────────────────────────────────
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipientRole: 'admin' }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.markNotificationRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (notification) {
            notification.isRead = true;
            await notification.save();
            res.json({ message: 'Notification marked as read' });
        } else {
            res.status(404).json({ message: 'Notification not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.clearNotifications = async (req, res) => {
    try {
        await Notification.deleteMany({ recipientRole: 'admin' });
        res.json({ message: 'Notifications cleared' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin sends a special offer email to all users
// @route   POST /api/auth/admin/send-offer
// @access  Admin Only
exports.sendSpecialOfferBlast = async (req, res) => {
    try {
        const { title, description, code } = req.body;

        if (!title || !description || !code) {
            return res.status(400).json({ message: 'Title, description, and code are required' });
        }

        const users = await User.find({ role: 'resident' }); // Only send to residents

        // Use Promise.all to send in parallel, but be mindful of rate limits if the user base is huge
        // For this project, parallel is fine.
        await Promise.all(users.map(user =>
            emailService.sendSpecialOfferEmail(user, { title, description, code })
        ));

        res.json({ message: `Successfully sent offer blast to ${users.length} users.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Assign spa schedule for a booking
// @route   PUT /api/auth/admin/bookings/:id/spa-schedule
// @access  Admin Only
exports.updateSpaSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const { spaSchedule, amenityName } = req.body;
        const booking = await Booking.findById(id).populate('user', 'fullName email');

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Validate date
        const scheduleDate = new Date(spaSchedule);
        if (scheduleDate < new Date(booking.checkIn) || scheduleDate > new Date(booking.checkOut)) {
            return res.status(400).json({ message: 'Spa schedule must be within the stay period' });
        }

        const amenity = booking.addOns.find(a => a.name === amenityName);
        if (!amenity) {
            return res.status(404).json({ message: 'Spa amenity not found in this booking' });
        }

        amenity.spaSchedule = scheduleDate;
        await booking.save();

        // Notify User
        await Notification.create({
            user: booking.user._id,
            recipientRole: 'user',
            type: 'System',
            message: `Your spa session for booking #${booking._id.toString().slice(-6)} has been scheduled for ${scheduleDate.toLocaleString()}.`,
            status: 'Success'
        });

        res.json({ message: 'Spa schedule updated', booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

