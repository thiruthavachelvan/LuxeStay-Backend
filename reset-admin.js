const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

async function resetAdmin() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB...');

    const newPassword = 'Admin@123';
    const adminEmail = 'admin@luxestay.com';

    const user = await User.findOne({ email: adminEmail });

    if (!user) {
        console.log(`Admin user ${adminEmail} not found!`);
        process.exit(1);
    }

    // Set plain-text password - the User model's pre-save hook will hash it automatically
    user.password = newPassword;
    user.role = 'admin'; // Ensure they have admin role
    await user.save();

    console.log(`✅ Admin password has been reset!`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${newPassword}`);

    await mongoose.disconnect();
    process.exit(0);
}

resetAdmin().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
