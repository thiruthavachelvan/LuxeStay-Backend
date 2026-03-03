const express = require('express');
const router = express.Router();
const {
    createSupportQuery,
    getUserQueries,
    getAllQueries,
    respondToQuery,
    assignQuery,
    getMyAssignedRequests,
    acceptServiceRequest,
    completeServiceRequest
} = require('../controllers/supportController');
const { protect, admin } = require('../middleware/authMiddleware');

// User routes
router.post('/submit', protect, createSupportQuery);
router.get('/my-queries', protect, getUserQueries);

// Admin routes
router.get('/admin/all', protect, admin, getAllQueries);
router.put('/admin/:id/respond', protect, admin, respondToQuery);
router.put('/admin/:id/assign', protect, admin, assignQuery);

// Staff routes
router.get('/staff/my-requests', protect, getMyAssignedRequests);
router.put('/staff/:id/accept', protect, acceptServiceRequest);
router.put('/staff/:id/complete', protect, completeServiceRequest);

module.exports = router;
