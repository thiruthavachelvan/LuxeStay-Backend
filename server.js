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

// Enhanced CORS — explicit origins for reliability
const allowedOrigins = [
    'https://luxestay-hotel-booking.netlify.app',
    'http://localhost:5173',
    'http://localhost:3000'
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
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
