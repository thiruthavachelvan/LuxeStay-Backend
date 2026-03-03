const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');
const Booking = require('./models/Booking');
const Room = require('./models/Room');
const Location = require('./models/Location');

dotenv.config({ path: path.join(__dirname, '.env') });

const seedBookings = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find a resident user to attach bookings to
        let user = await User.findOne({ role: 'resident' });
        if (!user) {
            console.log('No resident user found. Creating a test resident account...');
            user = await User.create({
                email: 'traveler@luxury.com',
                password: 'password123',
                role: 'resident',
                fullName: 'Arjun Sharma',
                phoneNumber: '+91 98765 43210',
                loyaltyPoints: 1250,
                preferences: { dietary: 'Veg', roomType: 'Executive Suite' }
            });
            console.log(`Created test resident: ${user.email}`);
        }

        console.log(`Seeding bookings for: ${user.email}`);

        // Clear existing bookings for this user to avoid clutter
        await Booking.deleteMany({ user: user._id });

        // Find some locations and rooms
        const mumbai = await Location.findOne({ city: 'Mumbai' });
        const dubai = await Location.findOne({ city: 'Dubai' });

        if (!mumbai || !dubai) {
            console.error('Locations not found. Please seed locations first.');
            process.exit(1);
        }

        const mumbaiRoom = await Room.findOne({ location: mumbai._id });
        const dubaiRoom = await Room.findOne({ location: dubai._id });

        const bookings = [
            {
                user: user._id,
                room: mumbaiRoom._id,
                location: mumbai._id,
                checkIn: new Date('2026-03-10'),
                checkOut: new Date('2026-03-15'),
                totalPrice: 25000,
                status: 'Confirmed',
                guests: { adults: 2, children: 1 },
                paymentStatus: 'Paid'
            },
            {
                user: user._id,
                room: dubaiRoom._id,
                location: dubai._id,
                checkIn: new Date('2026-05-20'),
                checkOut: new Date('2026-05-25'),
                totalPrice: 45000,
                status: 'Confirmed',
                guests: { adults: 2, children: 0 },
                paymentStatus: 'Pending'
            },
            {
                user: user._id,
                room: mumbaiRoom._id,
                location: mumbai._id,
                checkIn: new Date('2026-01-05'),
                checkOut: new Date('2026-01-10'),
                totalPrice: 18000,
                status: 'Completed',
                guests: { adults: 1, children: 0 },
                paymentStatus: 'Paid'
            }
        ];

        await Booking.insertMany(bookings);
        console.log(`Successfully integrated ${bookings.length} stay records.`);
        process.exit();
    } catch (error) {
        console.error('Error seeding bookings:', error);
        process.exit(1);
    }
};

seedBookings();
