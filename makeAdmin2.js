const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/.env' });
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        const user = await User.findOneAndUpdate(
            { email: 'test_user_unique_99@test.com' },
            { role: 'admin' },
            { new: true }
        );
        console.log('Made admin:', user ? user.email : 'not found');
        process.exit();
    }).catch(err => {
        console.error('Connection error', err);
        process.exit(1);
    });
