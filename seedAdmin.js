const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
    try {
        console.log('Connecting to:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB.');

        const adminEmail = 'admin@luxestay.com';
        const adminPassword = 'admin_luxury_2024';

        let user = await User.findOne({ email: adminEmail });

        if (user) {
            console.log('Admin found. Current role:', user.role);
            user.role = 'admin';
            // Explicitly set password to ensure we know it
            user.password = adminPassword;
            await user.save();
            console.log('Admin updated and role set to admin.');
        } else {
            user = await User.create({
                email: adminEmail,
                password: adminPassword,
                role: 'admin'
            });
            console.log('New Admin user created.');
        }

        const verification = await User.findOne({ email: adminEmail });
        console.log('Verification - Email:', verification.email, 'Role:', verification.role);

        console.log('--- SEEDING COMPLETE ---');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
