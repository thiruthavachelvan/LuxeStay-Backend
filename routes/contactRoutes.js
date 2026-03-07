const express = require('express');
const router = express.Router();
const {
    submitContactForm,
    getAllContacts,
    updateContactStatus,
    replyToContact,
    deleteContact,
    deleteMyContact
} = require('../controllers/contactController');
const { protect, admin, optionalProtect } = require('../middleware/authMiddleware');

// Public
router.post('/', optionalProtect, submitContactForm);

// User routes
router.delete('/my/:id', protect, deleteMyContact);

// Admin routes
router.get('/admin/all', protect, admin, getAllContacts);
router.put('/admin/:id', protect, admin, updateContactStatus);
router.post('/admin/:id/reply', protect, admin, replyToContact);
router.delete('/admin/:id', protect, admin, deleteContact);

module.exports = router;
