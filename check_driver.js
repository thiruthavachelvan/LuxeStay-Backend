require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ email: /newyork/i });
    if (user) {
        console.log('User found:', user.email);
        console.log('Match result:', await user.matchPassword(user.staffPassword));
    } else {
        console.log('No driver found with newyork in email');
    }
    await mongoose.disconnect();
}

check();
