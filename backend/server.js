// require('dotenv').config({ path: __dirname + '/.env' });
// const express = require('express');
// const cors = require('cors');
// const connectDB = require('./config/db');

// // Connect to Database
// connectDB();

// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Routes
// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/modules', require('./routes/moduleRoutes'));
// app.use('/api/quizzes', require('./routes/quizRoutes'));
// app.use('/api/admin', require('./routes/adminRoutes'));
// app.use(express.urlencoded({ extended: true }));

// // Root route
// app.get('/', (req, res) => {
//     res.send('CrisisCraft API is running...');
// });

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//     console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
// });
require('dotenv').config({ path: __dirname + '/.env' });

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Connect to Database
connectDB();

const app = express();

// ========================
// MIDDLEWARE (ORDER MATTERS)
// ========================
app.use(cors());

// IMPORTANT: body parsers must come BEFORE routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================
// ROUTES
// ========================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/modules', require('./routes/moduleRoutes'));
app.use('/api/quizzes', require('./routes/quizRoutes'));
app.use('/api/drills', require('./routes/drillRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// ========================
// TEST ENDPOINT (DEBUG)
// ========================
app.post('/test', (req, res) => {
    console.log('✅ TEST ENDPOINT HIT');
    console.log('req.body:', req.body);
    res.json({ message: 'Test endpoint works!' });
});

// ========================
// ROOT ROUTE
// ========================
app.get('/', (req, res) => {
    res.send('CrisisCraft API is running...');
});

// ========================
// START SERVER
// ========================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
