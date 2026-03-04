const cron = require('node-cron');
const Booking = require('../models/Booking');
const User = require('../models/User');
const emailService = require('./emailService');

/**
 * Scheduled job to send reminders for bookings starting tomorrow
 * Runs every day at 10:00 AM
 */
const startReminderJob = () => {
    // Cron schedule: minute hour day-of-month month day-of-week
    // Running at 10:00 AM daily
    cron.schedule('0 10 * * *', async () => {
        console.log('[REMINDER JOB] Running daily booking reminder check...');

        try {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            const endOfTomorrow = new Date(tomorrow);
            endOfTomorrow.setHours(23, 59, 59, 999);

            // Find bookings checking in tomorrow
            const upcomingBookings = await Booking.find({
                checkIn: { $gte: tomorrow, $lte: endOfTomorrow },
                status: 'Confirmed'
            }).populate('user');

            console.log(`[REMINDER JOB] Found ${upcomingBookings.length} bookings for tomorrow.`);

            for (const booking of upcomingBookings) {
                if (booking.user && booking.user.email) {
                    console.log(`[REMINDER JOB] Sending reminder to ${booking.user.email} for booking ${booking._id}`);
                    await emailService.sendStayReminderEmail(booking, booking.user);
                }
            }
        } catch (error) {
            console.error('[REMINDER JOB] Error in reminder job:', error);
        }
    });

    console.log('[REMINDER JOB] Automated booking reminders scheduled for 10:00 AM daily.');
};

module.exports = startReminderJob;
