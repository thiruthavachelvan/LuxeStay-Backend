const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({});
        console.log('All Users:');
        users.forEach(u => {
            console.log(`Email: ${u.email}, Role: ${u.role}, ID: ${u._id}`);
        });
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkUsers();
