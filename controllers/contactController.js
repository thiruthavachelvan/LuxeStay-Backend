const Contact = require('../models/Contact');
const Notification = require('../models/Notification');

// @desc    Submit a contact form message (public)
// @route   POST /api/contact
// @access  Public
exports.submitContactForm = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const contact = await Contact.create({ name, email, subject, message });

        // Notify admin
        await Notification.create({
            type: 'Service Request',
            category: 'contact',
            recipientRole: 'admin',
            message: `New contact form submission from ${name} (${email}): "${subject}"`,
            status: 'Info'
        });

        res.status(201).json({ message: 'Your message has been sent! We will get back to you within 24 hours.', contact });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all contact form messages (Admin)
// @route   GET /api/contact/admin/all
// @access  Private/Admin
exports.getAllContacts = async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.json(contacts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update contact status / admin reply
// @route   PUT /api/contact/admin/:id
// @access  Private/Admin
exports.updateContactStatus = async (req, res) => {
    try {
        const { status, adminReply } = req.body;
        const contact = await Contact.findByIdAndUpdate(
            req.params.id,
            { status, adminReply },
            { new: true }
        );
        if (!contact) return res.status(404).json({ message: 'Contact message not found.' });
        res.json({ message: 'Message updated', contact });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
