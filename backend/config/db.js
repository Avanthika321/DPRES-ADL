console.log("MONGO_URI:", process.env.MONGO_URI);
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        console.log('🔗 Attempting MongoDB connection...');
        console.log('MONGO_URI:', process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 50) + '...' : 'NOT SET');
        
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Error: ${error.message}`);
        console.error(`Full error:`, error);
        process.exit(1);
    }
};

module.exports = connectDB;
