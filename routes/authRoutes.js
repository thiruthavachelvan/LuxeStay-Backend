const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');
const {
    getUserProfile,
    updateUserProfile,
    getMyBookings,
    cancelBooking,
    getPaymentHistory,
    placeFoodOrder,
    getFoodOrders,
    getMyAssignedOrders,
    completeMyOrder,
    getUserNotifications,
    markUserNotificationRead,
    clearUserNotifications,
    createBooking,
    settleBookingFolio,
    checkInBooking,
    checkOutBooking,
    getAllBookings,
    saveGuestDetails
} = require('../controllers/userController');
const {
    createStaffAccount,
    getStaffMembers,
    createLocation,
    getLocations,
    updateLocation,
    createRoom,
    getRoomsByLocation,
    updateRoom,
    getMenuItems,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getNotifications,
    markNotificationRead,
    clearNotifications,
    getAdminFoodOrders,
    updateFoodOrderStatus,
    updateStaffAccount,
    deleteStaffMember,
    getAdminReservations,
    updateReservationStatus,
    getDashboardStats,
    adminCheckInBooking,
    adminCheckOutBooking,
    adminCancelBooking,
    getCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');
const { createMembershipOrder, verifyMembershipPayment, getMyMembership } = require('../controllers/membershipController');

router.post('/signup', registerUser);
router.post('/login', loginUser);

// --- User Routes ---
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.get('/my-bookings', protect, getMyBookings);
router.post('/bookings', protect, createBooking);
router.get('/payment-history', protect, getPaymentHistory);
router.get('/menu', protect, getMenuItems);
router.put('/bookings/:id/cancel', protect, cancelBooking);
router.put('/bookings/:id/guest-details', protect, saveGuestDetails);
router.put('/bookings/:id/settle-folio', protect, settleBookingFolio);
router.post('/food-order', protect, placeFoodOrder);
router.get('/food-order', protect, getFoodOrders);
router.get('/notifications', protect, getUserNotifications);
router.put('/notifications/:id/read', protect, markUserNotificationRead);
router.delete('/notifications/clear', protect, clearUserNotifications);
router.put('/bookings/:id/check-in', protect, checkInBooking);
router.put('/bookings/:id/check-out', protect, checkOutBooking);

// --- Membership Routes ---
router.post('/membership/create-order', protect, createMembershipOrder);
router.post('/membership/verify', protect, verifyMembershipPayment);
router.get('/membership', protect, getMyMembership);

// --- Staff Routes ---
router.get('/staff/food-orders', protect, getMyAssignedOrders);
router.put('/staff/food-orders/:id/complete', protect, completeMyOrder);

// --- Admin Routes ---
router.post('/admin/create-staff', protect, admin, createStaffAccount);
router.get('/admin/staff', protect, admin, getStaffMembers);
router.put('/admin/staff/:id', protect, admin, updateStaffAccount);
router.delete('/admin/staff/:id', protect, admin, deleteStaffMember);
router.post('/admin/locations', protect, admin, createLocation);
router.get('/admin/locations', protect, admin, getLocations);
router.put('/admin/locations/:id', protect, admin, updateLocation);
router.post('/admin/rooms', protect, admin, createRoom);
router.get('/admin/rooms/:locationId', protect, admin, getRoomsByLocation);
router.put('/admin/rooms/:id', protect, admin, updateRoom);

router.get('/admin/menu', protect, admin, getMenuItems);
router.post('/admin/menu', protect, admin, createMenuItem);
router.put('/admin/menu/:id', protect, admin, updateMenuItem);
router.delete('/admin/menu/:id', protect, admin, deleteMenuItem);

router.get('/admin/notifications', protect, admin, getNotifications);
router.put('/admin/notifications/:id', protect, admin, markNotificationRead);
router.delete('/admin/notifications', protect, admin, clearNotifications);

router.get('/admin/food-orders', protect, admin, getAdminFoodOrders);
router.put('/admin/food-orders/:id', protect, admin, updateFoodOrderStatus);

router.get('/admin/bookings', protect, admin, getAllBookings);
router.get('/admin/reservations', protect, admin, getAdminReservations);
router.put('/admin/reservations/:id', protect, admin, updateReservationStatus);

router.get('/admin/stats', protect, admin, getDashboardStats);
router.put('/admin/bookings/:id/check-in', protect, admin, adminCheckInBooking);
router.put('/admin/bookings/:id/check-out', protect, admin, adminCheckOutBooking);
router.put('/admin/bookings/:id/cancel', protect, admin, adminCancelBooking);

// --- Admin Coupon Routes ---
router.get('/admin/coupons', protect, admin, getCoupons);
router.post('/admin/coupons', protect, admin, createCoupon);
router.put('/admin/coupons/:id', protect, admin, updateCoupon);
router.delete('/admin/coupons/:id', protect, admin, deleteCoupon);

module.exports = router;
