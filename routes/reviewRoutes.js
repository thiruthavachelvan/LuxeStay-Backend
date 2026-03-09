const express = require('express');
const router = express.Router();
const {
    submitReview,
    getReviews,
    checkReview,
    getReviewsByLocation,
    getReviewsByRoom
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

// Public
router.get('/', getReviews);
router.get('/location/:locationId', getReviewsByLocation);
router.get('/room/:roomId', getReviewsByRoom);

// User routes
router.post('/', protect, submitReview);
router.get('/check/:bookingId', protect, checkReview);

module.exports = router;
