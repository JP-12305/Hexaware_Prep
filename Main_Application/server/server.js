// server/server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// --- Routes ---
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/adminRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const courseRoutes = require('./routes/courseRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Database Connection ---
const mongoUri = process.env.MONGO_URI;

// --- START DEBUG LOGGING ---
console.log('--- Attempting to connect to MongoDB ---');
if (mongoUri) {
    console.log('MONGO_URI found in .env file.');
} else {
    console.error('FATAL ERROR: MONGO_URI is not defined in your .env file.');
}
// --- END DEBUG LOGGING ---

mongoose.connect(mongoUri)
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
    // This will print the specific reason the connection failed.
    console.error('--- MongoDB connection error: ---');
    console.error(err);
});


// --- API Route Definitions ---
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/courses', courseRoutes);

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
