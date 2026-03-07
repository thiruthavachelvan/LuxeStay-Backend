const Contact = require('../models/Contact');
const Notification = require('../models/Notification');
const emailService = require('../utils/emailService');

// @desc    Submit a contact form message (public)
// @route   POST /api/contact
// @access  Public
exports.submitContactForm = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const contact = await Contact.create({
            name,
            email,
            subject,
            message,
            user: req.user ? req.user._id : null
        });

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

// @desc    Admin replies to contact message
// @route   POST /api/contact/admin/:id/reply
// @access  Private/Admin
exports.replyToContact = async (req, res) => {
    try {
        const { id } = req.params;
        const { reply } = req.body;

        if (!reply) {
            return res.status(400).json({ message: 'Reply text is required.' });
        }

        const contact = await Contact.findById(id);

        if (!contact) {
            return res.status(404).json({ message: 'Contact message not found.' });
        }

        contact.status = 'Replied';
        contact.adminReply = reply;
        await contact.save();

        // Send Email
        await emailService.sendContactReplyEmail(contact, reply);

        res.json({ message: 'Reply sent successfully', contact });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete contact form message (Admin)
// @route   DELETE /api/contact/admin/:id
// @access  Private/Admin
exports.deleteContact = async (req, res) => {
    try {
        const contact = await Contact.findByIdAndDelete(req.params.id);
        if (!contact) return res.status(404).json({ message: 'Contact message not found.' });
        res.json({ message: 'Message erased from archives' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Delete OWN contact message (User)
// @route   DELETE /api/contact/my/:id
// @access  Private
exports.deleteMyContact = async (req, res) => {
    try {
        const contact = await Contact.findOne({ _id: req.params.id, user: req.user._id });
        if (!contact) return res.status(404).json({ message: 'Message not found or not authorized to delete.' });

        await Contact.findByIdAndDelete(req.params.id);
        res.json({ message: 'Message removed from your stream' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
