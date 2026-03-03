const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');
const Location = require('./models/Location');

dotenv.config({ path: path.join(__dirname, '.env') });

const seedStaff = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const locations = await Location.find({ status: 'Active' });
        if (locations.length < 5) {
            console.error('Not enough active locations to assign 5 staff members uniquely. Please ensure at least 5 active locations exist.');
            // We'll proceed anyway and reuse locations if needed, but the user asked for "each staff... for one location"
        }

        const staffData = [
            { email: 'driver.mumbai@luxestay.com', password: 'password123', role: 'driver', city: 'Mumbai' },
            { email: 'cook.dubai@luxestay.com', password: 'password123', role: 'cook', city: 'Dubai' },
            { email: 'service.chennai@luxestay.com', password: 'password123', role: 'room-service', city: 'Chennai' },
            { email: 'plumber.delhi@luxestay.com', password: 'password123', role: 'plumber', city: 'Delhi' },
            { email: 'cleaner.nyc@luxestay.com', password: 'password123', role: 'cleaner', city: 'New York' },
        ];

        for (const data of staffData) {
            const location = await Location.findOne({ city: data.city });
            if (!location) {
                console.warn(`Location ${data.city} not found. Skipping staff ${data.email}`);
                continue;
            }

            const existingStaff = await User.findOne({ email: data.email });
            if (existingStaff) {
                console.log(`Staff ${data.email} already exists. Updating location.`);
                existingStaff.location = location._id;
                await existingStaff.save();
                continue;
            }

            await User.create({
                email: data.email,
                password: data.password,
                role: data.role,
                location: location._id
            });
            console.log(`Created staff: ${data.email} at ${data.city}`);
        }

        console.log('Staff seeding completed successfully');
        process.exit();
    } catch (error) {
        console.error('Error seeding staff:', error);
        process.exit(1);
    }
};

seedStaff();
