const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const resetStaff = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const roles = ['cook', 'driver', 'cleaner', 'plumber', 'room-service'];
        console.log('\n--- STAFF CREDENTIALS ---');

        for (let role of roles) {
            let staff = await User.findOne({ role });

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('staff123', salt);

            if (!staff) {
                staff = new User({
                    fullName: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`,
                    email: `${role}@luxestays.com`,
                    password: hashedPassword,
                    role: role,
                    staffPassword: 'staff123'
                });
                await staff.save();
                console.log(`Created: ${staff.email} / staff123`);
            } else {
                staff.password = hashedPassword;
                staff.staffPassword = 'staff123';
                await staff.save();
                console.log(`Reset: ${staff.email} / staff123`);
            }
        }

        console.log('-------------------------\n');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

resetStaff();
