const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medical_market_db', {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB Connected] Host: ${conn.connection.host}, Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`[MongoDB Connection Error]: ${error.message}`);
    console.warn(`[Note]: Make sure MongoDB is installed and running locally, or update MONGO_URI in .env to a remote MongoDB Atlas connection string.`);
    // Do not terminate process immediately to allow app to inform frontend gracefully
  }
};

module.exports = connectDB;
