const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/.env' });
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        const user = await User.findOneAndUpdate({ email: 'admin_test@example.com' }, { role: 'admin' }, { new: true, upsert: true });
        user.password = '$2a$10$0dM4h/RMY1C8G8b/4.4Q/eiwX0k.NqYpTj1d.v0lR4p.n.0aA4c/W'; // password123
        await user.save();
        console.log('Made admin:', user.email);
        process.exit();
    }).catch(err => {
        console.error('Connection error', err);
        process.exit(1);
    });
