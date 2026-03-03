require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function migrate() {
    await mongoose.connect(process.env.MONGODB_URI);
    const staffRoles = ['driver', 'cook', 'room-service', 'plumber', 'cleaner'];
    const staff = await User.find({ role: { $in: staffRoles } });

    console.log(`Found ${staff.length} staff members.`);

    for (const member of staff) {
        if (member.staffPassword) {
            console.log(`Fixing password for ${member.email}...`);
            // We set the plain password; the pre-save hook will hash it ONCE
            member.password = member.staffPassword;
            await member.save();
        }
    }

    console.log('Migration complete.');
    await mongoose.disconnect();
}

migrate();
