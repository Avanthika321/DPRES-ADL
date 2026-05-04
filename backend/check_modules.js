const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Module = require('./models/Module');
const User = require('./models/User');

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkModules() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const modules = await Module.find({});
        console.log(`Total Modules: ${modules.length}`);
        modules.forEach(m => {
            console.log(`- Title: ${m.title}, Standard: "${m.targetStandard}", Section: "${m.targetSection}"`);
        });

        const students = await User.find({ role: 'student' });
        console.log(`\nStudents:`);
        students.forEach(s => {
            console.log(`- Name: ${s.name}, Email: ${s.email}, Standard: "${s.standard}", Section: "${s.section}"`);
        });

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkModules();
