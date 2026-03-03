// Minimal inline express test to see if the food-order route works
const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const PORT = 5001; // Different port so we don't conflict

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Test server running on port ${PORT}`);

            // List all routes
            const router = authRoutes;
            router.stack.forEach(r => {
                if (r.route && r.route.path) {
                    const methods = Object.keys(r.route.methods).join(', ').toUpperCase();
                    console.log(`${methods}: ${r.route.path}`);
                }
            });
        });
    })
    .catch(console.error);
