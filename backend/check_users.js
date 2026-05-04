const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });
const User = require('./models/User');

async function checkUsers() {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({}, 'name email role standard section');
    console.log('--- ALL USERS ---');
    console.log(JSON.stringify(users, null, 2));
    process.exit();
}

checkUsers();
