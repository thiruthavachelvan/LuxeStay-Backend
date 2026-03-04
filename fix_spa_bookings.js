const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Support = require('./models/Support');
const Booking = require('./models/Booking');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Find the booking by ID (full ID from previous logs)
        const bookingId = '69a84c1bb283547d0fe4eab8';
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            console.error('Booking not found:', bookingId);
        } else {
            console.log('Found Booking:', bookingId);
            console.log('Stay Dates:', booking.checkIn, 'to', booking.checkOut);
        }

        // 2. Find all Spa Appointment Request support queries that don't have a booking ID
        const queries = await Support.find({
            subject: /Spa Appointment Request/i,
            booking: { $exists: false }
        });

        console.log(`Found ${queries.length} unlinked spa queries`);

        for (const q of queries) {
            // Find the most recent active/confirmed booking for this user
            const b = await Booking.findOne({
                user: q.user,
                status: { $in: ['Confirmed', 'CheckedIn'] }
            }).sort({ createdAt: -1 });

            if (b) {
                q.booking = b._id;
                await q.save();
                console.log(`Linked Query ${q._id} to Booking ${b._id}`);
            } else {
                console.log(`No matching booking found for user ${q.user} on query ${q._id}`);
            }
        }

        // 3. Verify the queries now have booking populated
        const updatedQueries = await Support.find({ subject: /Spa Appointment Request/i })
            .populate('booking', 'checkIn checkOut');

        console.log('--- Current Spa Queries State ---');
        updatedQueries.forEach(uq => {
            console.log(`Query: ${uq._id}`);
            console.log(`Subject: ${uq.subject}`);
            console.log(`Booking ID: ${uq.booking?._id || 'MISSING'}`);
            if (uq.booking) {
                console.log(`Stay: ${uq.booking.checkIn} - ${uq.booking.checkOut}`);
            }
            console.log('---------------------------');
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.connection.close();
        console.log('Disconnected');
    }
}

run();
