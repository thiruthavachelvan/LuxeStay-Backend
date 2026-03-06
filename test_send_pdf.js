const mongoose = require('mongoose');
const { sendBookingConfirmation } = require('./utils/emailService');
require('dotenv').config();

const testEmail = 'thirukumar3210@gmail.com';

const mockBooking = {
    _id: new mongoose.Types.ObjectId(),
    checkIn: new Date(Date.now() + 86400000), // Tomorrow
    checkOut: new Date(Date.now() + 86400000 * 3), // 3 days later
    totalPrice: 45000,
    status: 'Confirmed',
    paymentStatus: 'Paid',
    couponCode: 'LUXESTAY10',
    discountAmount: 4500,
    room: {
        type: 'Presidential Royal Suite',
        name: 'Royal Wing - 402'
    },
    location: {
        city: 'Geneva',
        name: 'LuxeStay International'
    },
    guests: {
        adults: 2,
        children: 1
    },
    guestDetails: [
        { name: 'John Doe', age: 34, gender: 'Male' },
        { name: 'Jane Doe', age: 32, gender: 'Female' },
        { name: 'Baby Doe', age: 4, gender: 'Female' }
    ],
    user: {
        fullName: 'Thiru Kumar',
        email: testEmail,
        phoneNumber: '+41 78 123 45 67',
        membershipTier: 'Platinum'
    },
    addOns: [
        { name: 'Airport Limousine Transfer', price: 5000 },
        { name: 'Champagne on Arrival', price: 3500 }
    ]
};

async function runTest() {
    console.log('--- Email Delivery Diagnostics ---');
    console.log('Target:', testEmail);
    console.log('From:', process.env.FROM_EMAIL);

    try {
        console.log('\n1. Attempting Simple Text Email...');
        const { sendWelcomeEmail } = require('./utils/emailService');
        await sendWelcomeEmail({ fullName: 'Thiru Test', email: testEmail });
        console.log('Welcome Email triggered.');

        console.log('\n2. Attempting PDF Manifest Email...');
        const { sendBookingConfirmation } = require('./utils/emailService');
        await sendBookingConfirmation(mockBooking);
        console.log('Booking Confirmation triggered.');

        console.log('\nCheck console for "Email sent successfully" messages.');
    } catch (err) {
        console.error('\nCRITICAL TEST FAILURE:');
        console.error(err);
    }
}

runTest();
