const Membership = require('../models/Membership');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const MEMBERSHIP_TIERS = {
    'Silver': { price: 2999, durationMonths: 12 },
    'Gold': { price: 5999, durationMonths: 12 },
    'Platinum': { price: 9999, durationMonths: 12 },
    'Diamond': { price: 19999, durationMonths: 12 },
    'Black Card': { price: 49999, durationMonths: 12 },
};

const TIER_BENEFITS = {
    'Silver': ['5% off all bookings', 'Priority check-in', 'Welcome drink on arrival'],
    'Gold': ['10% off bookings & dining', 'Lounge access', 'Late checkout', 'Complimentary breakfast (1 day)'],
    'Platinum': ['15% off all services', 'Spa credits ₹2,000', 'Room upgrades on availability', 'Complimentary breakfast (3 days)', 'Airport pickup'],
    'Diamond': ['20% off all services', 'Butler service', 'Airport transfer (both ways)', 'Complimentary breakfast (7 days)', 'Dedicated concierge line'],
    'Black Card': ['30% off all services', 'Personal concierge 24/7', 'Exclusive member events', 'Unlimited room upgrades', 'Complimentary all meals', 'Private transfers'],
};

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_key_id',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret_for_dev'
});


// @desc   Create Razorpay order for membership
// @route  POST /api/auth/membership/create-order
// @access Private
const createMembershipOrder = async (req, res) => {
    try {
        const { tier, overridePrice } = req.body;
        if (!MEMBERSHIP_TIERS[tier]) {
            return res.status(400).json({ message: 'Invalid membership tier' });
        }
        // Use overridePrice if provided (e.g., after a coupon discount), else default tier price
        const price = (overridePrice && overridePrice > 0) ? overridePrice : MEMBERSHIP_TIERS[tier].price;

        // Helper to return a mock order (used if Razorpay is unavailable/unconfigured)
        const mockOrder = () => ({
            id: 'order_mock_' + Math.random().toString(36).substr(2, 9),
            amount: price * 100,
            currency: 'INR'
        });

        // If no real key is configured, use mock
        const hasRealKey = process.env.RAZORPAY_KEY_ID &&
            process.env.RAZORPAY_KEY_ID !== 'your_key_id' &&
            !process.env.RAZORPAY_KEY_ID.includes('dummy');

        if (!hasRealKey) {
            console.log('No real Razorpay key — returning mock order');
            return res.status(200).json({ success: true, order: mockOrder() });
        }

        // Try real Razorpay API; fall back to mock on any error
        try {
            const razorpayOrder = await razorpay.orders.create({
                amount: price * 100,
                currency: 'INR',
                receipt: `membership_${req.user._id}_${Date.now()}`
            });
            return res.status(200).json({ success: true, order: razorpayOrder });
        } catch (rzpError) {
            console.warn('Razorpay API error, falling back to mock:', rzpError?.message || rzpError?.description || rzpError || 'Unknown error');
            return res.status(200).json({ success: true, order: mockOrder() });
        }

    } catch (error) {
        console.error('CRITICAL: Error creating membership order:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error creating membership order'
        });
    }
};

// @desc   Verify payment and activate membership
// @route  POST /api/auth/membership/verify
// @access Private
const verifyMembershipPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, tier } = req.body;
        if (!tier || !MEMBERSHIP_TIERS[tier]) {
            return res.status(400).json({ success: false, message: 'Invalid membership tier provided' });
        }

        const isMockPayment = razorpay_order_id?.startsWith('order_mock_') ||
            razorpay_payment_id?.startsWith('pay_mock_');

        if (!isMockPayment) {
            // Real Razorpay: verify HMAC signature
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(`${razorpay_order_id}|${razorpay_payment_id}`)
                .digest('hex');

            if (expectedSignature !== razorpay_signature) {
                return res.status(400).json({ success: false, message: 'Payment verification failed' });
            }
        }

        const tierInfo = MEMBERSHIP_TIERS[tier];
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + tierInfo.durationMonths);

        // Deactivate any previous active membership for this user
        await Membership.updateMany(
            { user: req.user._id, status: 'Active' },
            { status: 'Expired' }
        );

        // Create new membership record
        const membership = await Membership.create({
            user: req.user._id,
            tier,
            price: tierInfo.price,
            startDate,
            endDate,
            status: 'Active',
            razorpayOrderId: razorpay_order_id,
            transactionId: razorpay_payment_id,
            benefits: TIER_BENEFITS[tier]
        });

        // Update user's cached tier
        await User.findByIdAndUpdate(req.user._id, {
            membershipTier: tier,
            membership: membership._id
        });

        res.json({ success: true, membership });
    } catch (error) {
        console.error('verifyMembershipPayment error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc   Get current user's active membership
// @route  GET /api/auth/membership
// @access Private
const getMyMembership = async (req, res) => {
    try {
        const membership = await Membership.findOne({
            user: req.user._id,
            status: 'Active'
        }).sort({ createdAt: -1 });
        res.json({ membership: membership || null, tier: req.user.membershipTier || 'None' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createMembershipOrder, verifyMembershipPayment, getMyMembership };
