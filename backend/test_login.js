const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });
const User = require('./models/User');

async function testLogin(email, password) {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email });
    if (!user) {
        console.log('User not found');
        process.exit();
    }
    const isMatch = await user.matchPassword(password);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Match: ${isMatch}`);
    process.exit();
}

// Testing with the default password and the one the user might have used
testLogin('j@gmail.com', 'crisiscraft123');
