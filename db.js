const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables from .env

// MongoDB connection URI
const MONGO_URI = process.env.MONGO_URI; // Use MONGO_URI from .env

// Function to connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;