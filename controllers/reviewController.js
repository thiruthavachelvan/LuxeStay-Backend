const Review = require('../models/Review');
const Booking = require('../models/Booking');

// @desc    Get approved reviews for a specific room
// @route   GET /api/reviews/room/:roomId
// @access  Public
exports.getReviewsByRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        // Find all bookings for this room
        const bookings = await Booking.find({ room: roomId }).select('_id');
        const bookingIds = bookings.map(b => b._id);
        if (bookingIds.length === 0) return res.json([]);
        const reviews = await Review.find({ booking: { $in: bookingIds }, status: 'Approved' })
            .populate('user', 'fullName')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get reviews for a specific location (Room Detail page)
// @route   GET /api/reviews/location/:locationId
// @access  Public
exports.getReviewsByLocation = async (req, res) => {
    try {
        const { locationId } = req.params;
        // Reviews may be stored as city name string OR ObjectId.
        // First try by string (city name). If none found, try resolving via Location model.
        let reviews = await Review.find({ location: locationId, status: 'Approved' })
            .populate('user', 'fullName')
            .sort({ createdAt: -1 })
            .limit(20);

        // If no results found by string and the param looks like an ObjectId, resolve city name
        if (reviews.length === 0 && /^[a-f\d]{24}$/i.test(locationId)) {
            const Location = require('../models/Location');
            const loc = await Location.findById(locationId);
            if (loc) {
                reviews = await Review.find({ location: loc.city, status: 'Approved' })
                    .populate('user', 'fullName')
                    .sort({ createdAt: -1 })
                    .limit(20);
            }
        }

        const total = reviews.length;
        const avg = total > 0 ? (reviews.reduce((a, r) => a + r.overallRating, 0) / total).toFixed(1) : 0;
        res.json({ reviews, totalCount: total, avgRating: avg });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Submit a review (user must have a completed booking)
// @route   POST /api/reviews
// @access  Private
exports.submitReview = async (req, res) => {
    try {
        const { bookingId, overallRating, categoryRatings, comment } = req.body;

        if (!bookingId || !overallRating || !comment) {
            return res.status(400).json({ message: 'Booking ID, rating, and comment are required.' });
        }

        // Verify booking belongs to user and is completed
        const booking = await Booking.findOne({ _id: bookingId, user: req.user._id });
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }
        if (booking.status !== 'CheckedOut' && booking.status !== 'Completed') {
            return res.status(400).json({ message: 'You can only review after completing your stay.' });
        }

        // Check for duplicate
        const existing = await Review.findOne({ booking: bookingId });
        if (existing) {
            return res.status(400).json({ message: 'You have already submitted a review for this booking.' });
        }

        const review = await Review.create({
            user: req.user._id,
            booking: bookingId,
            location: booking.location || 'LuxeStay Hotel',
            overallRating,
            categoryRatings,
            comment
        });

        res.status(201).json({ message: 'Review submitted successfully!', review });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'You have already reviewed this booking.' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all approved reviews (public)
// @route   GET /api/reviews
// @access  Public
exports.getReviews = async (req, res) => {
    try {
        const { location, rating, sort } = req.query;

        let filter = { status: 'Approved' };
        if (location) filter.location = { $regex: location, $options: 'i' };
        if (rating) filter.overallRating = parseInt(rating);

        let sortOption = { createdAt: -1 };
        if (sort === 'highest') sortOption = { overallRating: -1 };
        if (sort === 'lowest') sortOption = { overallRating: 1 };
        if (sort === 'oldest') sortOption = { createdAt: 1 };

        const reviews = await Review.find(filter)
            .populate('user', 'fullName')
            .sort(sortOption)
            .limit(50);

        // Compute aggregate stats
        const all = await Review.find({ status: 'Approved' });
        const totalCount = all.length;
        const avgRating = totalCount > 0
            ? (all.reduce((acc, r) => acc + r.overallRating, 0) / totalCount).toFixed(1)
            : 0;

        const breakdown = [5, 4, 3, 2, 1].map(star => ({
            star,
            count: all.filter(r => r.overallRating === star).length
        }));

        const categoryAvgs = ['cleanliness', 'service', 'location', 'foodQuality', 'valueForMoney'].reduce((acc, cat) => {
            const valid = all.filter(r => r.categoryRatings && r.categoryRatings[cat]);
            acc[cat] = valid.length > 0
                ? (valid.reduce((s, r) => s + r.categoryRatings[cat], 0) / valid.length).toFixed(1)
                : 0;
            return acc;
        }, {});

        res.json({ reviews, totalCount, avgRating, breakdown, categoryAvgs });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Check if user has already reviewed a specific booking
// @route   GET /api/reviews/check/:bookingId
// @access  Private
exports.checkReview = async (req, res) => {
    try {
        const review = await Review.findOne({
            booking: req.params.bookingId,
            user: req.user._id
        });
        res.json({ hasReview: !!review, review: review || null });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all reviews (Admin)
// @route   GET /api/reviews/admin/all
// @access  Private/Admin
exports.getAllReviewsAdmin = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('user', 'fullName email')
            .populate('booking', 'checkInDate checkOutDate')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve/reject a review (Admin)
// @route   PUT /api/reviews/admin/:id/status
// @access  Private/Admin
exports.updateReviewStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const review = await Review.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        if (!review) return res.status(404).json({ message: 'Review not found' });
        res.json({ message: `Review ${status}`, review });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
