const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const checkUsers = async () => {
    try {
        const testURI = process.env.MONGO_URI.replace('CrisisCraft', 'test');
        console.log('Connecting to:', testURI);
        await mongoose.connect(testURI);
        console.log('Connected!');

        const users = await User.find({});
        console.log('Total users found:', users.length);
        if (users.length > 0) {
            console.log('Users list:');
            users.forEach(u => console.log(`- ${u.email} (${u.role})`));
        } else {
            console.log('No users found in this database.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

checkUsers();
