const dotenv = require('dotenv');
dotenv.config({ override: true });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const supportRoutes = require('./routes/supportRoutes');
const publicRoutes = require('./routes/publicRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const contactRoutes = require('./routes/contactRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const startReminderJob = require('./utils/reminderJob');

const app = express();

// Start Background Jobs
startReminderJob();

// CORS — allow all origins (reliable for deployment)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());




// Routes
app.use('/api/auth', authRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/payment', paymentRoutes);

// Database Connection
mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
    .then(() => console.log('Connected to Luxury MongoDB'))
    .catch(err => {
        console.error('MongoDB connection error:', err.message);
        // Do not crash, let the API routes return 500s instead of hanging
    });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Luxury Server running on port ${PORT}`));
