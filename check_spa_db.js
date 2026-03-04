const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Support = require('./models/Support');
const Notification = require('./models/Notification');
const Booking = require('./models/Booking');
const User = require('./models/User'); // Required for population

async function checkDb() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        console.log('\n--- Recent Support Queries ---');
        const queries = await Support.find().sort({ createdAt: -1 }).limit(5).populate('user', 'email');
        queries.forEach(q => {
            console.log(`ID: ${q._id}, Subject: ${q.subject}, Status: ${q.status}, User: ${q.user?.email}, CreatedAt: ${q.createdAt}`);
        });

        console.log('\n--- Recent Admin Notifications ---');
        const notifications = await Notification.find({ recipientRole: 'admin' }).sort({ createdAt: -1 }).limit(5);
        notifications.forEach(n => {
            console.log(`ID: ${n._id}, Type: ${n.type}, Message: ${n.message}, CreatedAt: ${n.createdAt}`);
        });

        console.log('\n--- Recent Spa Add-ons in Bookings ---');
        const bookingsWithSpa = await Booking.find({ 'addOns.name': /Spa/i }).sort({ updatedAt: -1 }).limit(5).populate('user', 'email');
        bookingsWithSpa.forEach(b => {
            console.log(`BookingID: ${b._id}, User: ${b.user?.email}, AddOns: ${JSON.stringify(b.addOns.map(a => a.name))}, UpdatedAt: ${b.updatedAt}`);
        });

        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

checkDb();
