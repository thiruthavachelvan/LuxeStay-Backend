const express = require('express');
const router = express.Router();
const {
    submitReview,
    getReviews,
    checkReview,
    getAllReviewsAdmin,
    updateReviewStatus,
    getReviewsByLocation,
    getReviewsByRoom
} = require('../controllers/reviewController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public
router.get('/', getReviews);
router.get('/location/:locationId', getReviewsByLocation);
router.get('/room/:roomId', getReviewsByRoom);

// User routes
router.post('/', protect, submitReview);
router.get('/check/:bookingId', protect, checkReview);

// Admin routes
router.get('/admin/all', protect, admin, getAllReviewsAdmin);
router.put('/admin/:id/status', protect, admin, updateReviewStatus);

module.exports = router;
