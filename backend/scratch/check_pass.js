const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const checkPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected!');

        const user = await User.findOne({ email: 'admin@gmail.com' });
        if (!user) {
            console.log('User admin@gmail.com not found!');
            await mongoose.disconnect();
            process.exit(1);
        }

        console.log('Found user:', user.email, '- role:', user.role);
        console.log('Password hash:', user.password);

        const passwords = ['admin', 'admin123', '123456', 'password', 'password123', 'admin@123', 'Admin123', 'Admin@123'];
        for (const pass of passwords) {
            const isMatch = await user.matchPassword(pass);
            console.log(`  "${pass}" => ${isMatch ? '✅ MATCH' : '❌ no'}`);
            if (isMatch) {
                console.log(`\n🔑 Password for admin@gmail.com is: "${pass}"`);
                await mongoose.disconnect();
                process.exit(0);
            }
        }

        console.log('\nNone of the common passwords matched.');
        await mongoose.disconnect();
        process.exit(1);
    } catch (err) {
        console.error('Error:', err.message);
        await mongoose.disconnect();
        process.exit(1);
    }
};

checkPassword();
