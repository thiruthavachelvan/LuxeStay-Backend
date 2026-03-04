const express = require('express');
const router = express.Router();
const {
    submitContactForm,
    getAllContacts,
    updateContactStatus,
    replyToContact
} = require('../controllers/contactController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public
router.post('/', submitContactForm);

// Admin routes
router.get('/admin/all', protect, admin, getAllContacts);
router.put('/admin/:id', protect, admin, updateContactStatus);
router.post('/admin/:id/reply', protect, admin, replyToContact);

module.exports = router;
