require('dotenv').config();
console.log('Secret present:', !!process.env.JWT_SECRET);
if (process.env.JWT_SECRET) {
    console.log('Secret start:', process.env.JWT_SECRET.substring(0, 3));
}
