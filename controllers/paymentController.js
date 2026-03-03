const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config(); // Load environment variables here before initializing Razorpay

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create Razorpay Order
// @route   POST /api/payment/create-order
// @access  Private
exports.createOrder = async (req, res) => {
    try {
        const { amount, currency = 'INR' } = req.body;

        if (!amount) {
            return res.status(400).json({ message: 'Amount is required' });
        }

        const options = {
            amount: Math.round(amount * 100), // convert to smallest currency unit (paise)
            currency,
            receipt: `rcpt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error('Razorpay Create Order Error:', error);
        res.status(500).json({ message: 'Could not generate payment order.' });
    }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/payment/verify
// @access  Private
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            return res.json({ success: true, message: "Payment verified successfully" });
        } else {
            return res.status(400).json({ success: false, message: "Invalid signature" });
        }
    } catch (error) {
        console.error('Razorpay Verify Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
