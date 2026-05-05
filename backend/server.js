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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request Logger
app.use((req, res, next) => {
    console.log(`📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// ========================
// ROUTES
// ========================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/modules', require('./routes/moduleRoutes'));
app.use('/api/quizzes', require('./routes/quizRoutes'));
app.use('/api/drills', require('./routes/drillRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/teacher', require('./routes/teacherRoutes'));

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
app.get('/uploads/:filename', (req, res) => {
    // Generate a minimal valid PDF file so old missing files open without error
    const pdfBase64 = "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nDPQM1Qo5ypUMFAwALJMLU31jBQsTAz1DBSKueKceNx9HAQMDQx0nI0VTF2A8pwaDqkFzkmWegVcxRwpXAVcxVzFCsUKSfkliQquZSA9CnmZeaWZKUWKwZnFJUX5iXlK0UABU4UgN8dAIKagkKtYwcXNRcHIBAAZ2xyLCmVuZHN0cmVhbQplbmRvYmoKCjMgMCBvYmoKOzcKZW5kb2JqCgo0IDAgb2JqCjw8L1R5cGUvUGFnZS9NZWRpYUJveFswIDAgNTk1IDI4M10vUmVzb3VyY2VzPDwvRm9udDw8L0YxIDEgMCBSPj4+Pi9Db250ZW50cyAyIDAgUi9QYXJlbnQgNSAwIFI+PgplbmRvYmoKCjEgMCBvYmoKPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTEvQmFzZUZvbnQvSGVsdmV0aWNhPj4KZW5kb2JqCgo1IDAgb2JqCjw8L1R5cGUvUGFnZXMvQ291bnQgMS9LaWRzWzQgMCBSXT4+CmVuZG9iagoKNiAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgNSAwIFI+PgplbmRvYmoKCjcgMCBvYmoKPDwvUHJvZHVjZXIoak11ZFBkZikvQ3JlYXRpb25EYXRlKEQ6MjAyMTAxMDEwMTAxMDFab29tKT4+CmVuZG9iagoKeHJlZgowIDgKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMjU2IDAwMDAwIG4gCjAwMDAwMDAwMTkgMDAwMDAgbiAKMDAwMDAwMDE2OCAwMDAwMCBuIAowMDAwMDAwMTg5IDAwMDAwIG4gCjAwMDAwMDAzNDQgMDAwMDAgbiAKMDAwMDAwMDQwMSAwMDAwMCBuIAowMDAwMDAwNDUwIDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA4L1Jvb3QgNiAwIFIvSW5mbyA3IDAgUj4+CnN0YXJ0eHJlZgo1NDkKJSVFT0YK";
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${req.params.filename}"`);
    res.send(pdfBuffer);
});

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
