const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });
const User = require('./models/User');

async function debugUsers() {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({});
    console.log('--- DEBUG USERS ---');
    users.forEach(u => {
        console.log({
            id: u._id,
            name: u.name,
            email: `"${u.email}"`,
            role: u.role,
            passwordHash: u.password.substring(0, 10) + '...'
        });
    });
    process.exit();
}

debugUsers();
