'use strict';

const mongoose = require('mongoose');
const config = require('./env');

/**
 * MongoDB connection manager.
 *
 * WHY SEPARATE FILE?
 * - Keeps server.js clean
 * - Easy to import in tests (connect before, disconnect after)
 * - One place to configure Mongoose options
 *
 * WHY mongoose.connect() ONCE?
 * Mongoose maintains a connection pool internally. You call connect() once
 * at startup, and every model query reuses the same connections.
 * You never need to open/close connections per request — that would be slow.
 *
 * EVENTS:
 * Mongoose emits events on the connection object. We log them so:
 *   - 'disconnected' tells us if MongoDB drops (network issue, Atlas restart)
 *   - 'error' catches unexpected connection errors after startup
 */
const connectDB = async () => {
  try {
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error:', err.message);
    });

    const conn = await mongoose.connect(config.mongoUri, {
      // These options prevent deprecation warnings
      serverSelectionTimeoutMS: 5000, // Fail fast if MongoDB not running
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('   Make sure MongoDB is running. Start it with:');
    console.error('   docker run -d -p 27017:27017 --name codemate-mongo mongo:7');
    process.exit(1); // Exit — no point running without a database
  }
};

/**
 * Gracefully close the connection.
 * Called during server shutdown so in-flight queries can complete.
 */
const disconnectDB = async () => {
  await mongoose.connection.close();
  console.log('✅ MongoDB disconnected gracefully');
};

module.exports = { connectDB, disconnectDB };
