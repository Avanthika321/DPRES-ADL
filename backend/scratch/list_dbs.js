require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const listDatabases = async () => {
    try {
        console.log('Connecting...');
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected!');

        const admin = new mongoose.mongo.Admin(conn.connection.db);
        const result = await admin.listDatabases();
        console.log('Databases found:');
        result.databases.forEach(db => console.log(`- ${db.name}`));

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

listDatabases();
