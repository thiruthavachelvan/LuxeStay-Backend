const Support = require('../models/Support');
const Notification = require('../models/Notification');
const emailService = require('../utils/emailService');

// @desc    Create a support query
// @route   POST /api/support/submit
// @access  Private
exports.createSupportQuery = async (req, res) => {
    try {
        const { subject, message, priority } = req.body;

        if (!subject || !message) {
            return res.status(400).json({ message: 'Subject and message are required' });
        }

        const Booking = require('../models/Booking');
        const activeBooking = await Booking.findOne({
            user: req.user._id,
            status: { $in: ['CheckedIn', 'Confirmed'] }
        }).sort({ checkIn: 1 });

        const query = await Support.create({
            user: req.user._id,
            subject,
            message,
            priority: priority || 'Standard',
            location: activeBooking ? activeBooking.location : null
        });

        // Create notification for admin
        await Notification.create({
            type: 'Service Request',
            category: 'query',
            recipientRole: 'admin',
            message: `New service request from ${req.user.email}: ${subject}`,
            status: 'Urgent'
        });

        // Create notification for user (Confirmation)
        await Notification.create({
            type: 'System',
            category: 'query',
            recipientRole: 'user',
            user: req.user._id,
            message: `Your service request "${subject}" has been successfully logged.`,
            status: 'Info'
        });

        res.status(201).json(query);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user's support queries
// @route   GET /api/support/my-queries
// @access  Private
exports.getUserQueries = async (req, res) => {
    try {
        const queries = await Support.find({ user: req.user._id })
            .populate('assignedTo', 'email role')
            .sort({ createdAt: -1 });
        res.json(queries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all support queries (Admin)
// @route   GET /api/support/admin/all
// @access  Private/Admin
exports.getAllQueries = async (req, res) => {
    try {
        const queries = await Support.find()
            .populate('user', 'fullName email')
            .populate('assignedTo', 'email role')
            .populate('location', 'city')
            .sort({ createdAt: -1 });
        res.json(queries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin assigns staff to a support query
// @route   PUT /api/support/admin/:id/assign
// @access  Private/Admin
exports.assignQuery = async (req, res) => {
    try {
        const { assignedTo } = req.body;
        const query = await Support.findById(req.params.id);

        if (!query) return res.status(404).json({ message: 'Query not found' });

        query.assignedTo = assignedTo;
        query.status = 'Assigned';
        await query.save();

        const updated = await Support.findById(query._id)
            .populate('user', 'fullName email')
            .populate('assignedTo', 'email role');

        // Create notification for the user
        await Notification.create({
            type: 'Staff Alert',
            category: 'assignment',
            recipientRole: 'user',
            message: `Staff (${updated.assignedTo.role}) has been assigned to your request: ${query.subject}`,
            user: query.user,
            status: 'Info'
        });

        // Create notification for the staff
        await Notification.create({
            type: 'Staff Alert',
            category: 'assignment',
            recipientRole: 'staff',
            message: `You have been assigned a new service request: ${query.subject} from ${updated.user.email}`,
            user: assignedTo,
            status: 'Info'
        });

        res.json({ message: 'Staff assigned successfully', query: updated });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Respond to a support query (Admin) — also resolves it
// @route   PUT /api/support/admin/:id/respond
// @access  Private/Admin
exports.respondToQuery = async (req, res) => {
    try {
        const query = await Support.findById(req.params.id);

        if (query) {
            query.adminResponse = req.body.response;
            query.status = 'Resolved';
            const updatedQuery = await query.save();

            // Notify user
            await Notification.create({
                type: 'System',
                category: 'completion',
                recipientRole: 'user',
                message: `Your request "${query.subject}" has been resolved by Admin.`,
                user: query.user,
                status: 'Success'
            });

            // Trigger Service Resolution Email (Async)
            const user = await require('../models/User').findById(query.user);
            emailService.sendServiceResolutionEmail({ type: query.subject, response: query.adminResponse }, user);

            res.json(updatedQuery);
        } else {
            res.status(404).json({ message: 'Query not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Staff gets their assigned service requests
// @route   GET /api/support/staff/my-requests
// @access  Private (Staff)
exports.getMyAssignedRequests = async (req, res) => {
    try {
        const requests = await Support.find({ assignedTo: req.user._id })
            .populate('user', 'email')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Staff accepts an assigned service request
// @route   PUT /api/support/staff/:id/accept
// @access  Private (Staff)
exports.acceptServiceRequest = async (req, res) => {
    try {
        const request = await Support.findOne({ _id: req.params.id, assignedTo: req.user._id });
        if (!request) return res.status(404).json({ message: 'Request not found or not assigned to you' });

        request.status = 'Accepted';
        request.acceptedAt = new Date();
        await request.save();

        // Notify user that staff is on the way
        await Notification.create({
            type: 'Staff Alert',
            category: 'acceptance',
            recipientRole: 'user',
            message: `Staff member ${req.user.fullName} has accepted your request "${request.subject}" and is on the way.`,
            user: request.user,
            status: 'Info'
        });

        // Notify admin
        await Notification.create({
            type: 'System',
            category: 'acceptance',
            recipientRole: 'admin',
            message: `Service request "${request.subject}" accepted by ${req.user.fullName} (${req.user.role}).`,
            status: 'Info'
        });

        res.json({ message: 'Request accepted', request });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Staff completes an assigned service request
// @route   PUT /api/support/staff/:id/complete
// @access  Private (Staff)
exports.completeServiceRequest = async (req, res) => {
    try {
        const request = await Support.findOne({ _id: req.params.id, assignedTo: req.user._id });
        if (!request) return res.status(404).json({ message: 'Request not found or not assigned to you' });

        request.status = 'Completed';
        request.completedAt = new Date();
        await request.save();

        // Notify user
        await Notification.create({
            type: 'System',
            category: 'completion',
            recipientRole: 'user',
            message: `Your service request "${request.subject}" has been completed.`,
            user: request.user,
            status: 'Success'
        });

        // Trigger Service Resolution Email (Async)
        const user = await require('../models/User').findById(request.user);
        emailService.sendServiceResolutionEmail({ type: request.subject, response: 'Service request completed by staff.' }, user);

        // Notify admin
        await Notification.create({
            type: 'System',
            category: 'completion',
            recipientRole: 'admin',
            message: `Service request "${request.subject}" has been completed by ${req.user.fullName}.`,
            status: 'Info'
        });

        res.json({ message: 'Request marked as completed', request });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
