'use strict';

const mongoose = require('mongoose');
const config = require('./env');

const connectDB = async () => {
  try {
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error:', err.message);
    });

    const conn = await mongoose.connect(config.mongoUri, {

      serverSelectionTimeoutMS: 5000, 
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('   Make sure MongoDB is running. Start it with:');
    console.error('   docker run -d -p 27017:27017 --name codemate-mongo mongo:7');
    process.exit(1); 
  }
};

const disconnectDB = async () => {
  await mongoose.connection.close();
  console.log('✅ MongoDB disconnected gracefully');
};

module.exports = { connectDB, disconnectDB };
