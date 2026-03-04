require('dotenv').config();
const emailService = require('./utils/emailService');

const mockBooking = {
    _id: 'TEST_BOOKING_12345',
    status: 'Confirmed',
    paymentStatus: 'Paid',
    checkIn: new Date('2026-04-01'),
    checkOut: new Date('2026-04-05'),
    room: { type: 'Presidential Suite', name: 'Presidential Suite' },
    location: { city: 'Malibu', name: 'LuxeStay Malibu' },
    user: {
        fullName: 'Thiru Kumar',
        email: 'thirukumar3210@gmail.com',
        phoneNumber: '+1 987 654 3210',
        membershipTier: 'Platinum',
        membership: {
            benefits: [
                'Free Airport Transfer',
                'Complimentary Breakfast',
                'Access to Exclusive Platinum Lounge',
                'Late Checkout until 4 PM'
            ]
        }
    },
    guests: { adults: 2, children: 1 },
    guestDetails: [
        { name: 'Thiru Kumar', age: 30, gender: 'Male' },
        { name: 'Jane Kumar', age: 28, gender: 'Female' },
        { name: 'Little Kumar', age: 5, gender: 'Male' }
    ],
    addOns: [
        { name: 'Deep Tissue Massage (60 min)', price: 3500 }
    ],
    originalPrice: 200000,
    totalPrice: 175000,
    discountAmount: 25000,
    couponCode: 'LUXE25K'
};

async function runTest() {
    console.log('Sending Test Booking PDF...');
    await emailService.sendBookingConfirmation(mockBooking);
    console.log('Done!');
    process.exit(0);
}

runTest();
