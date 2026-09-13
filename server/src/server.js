'use strict';

const app = require('./app');
const config = require('./config/env');
const { connectDB, disconnectDB } = require('./config/database');

/**
 * Server startup.
 *
 * ORDER MATTERS:
 * 1. Connect to MongoDB FIRST
 * 2. THEN start listening for HTTP requests
 *
 * WHY?
 * If we accepted HTTP requests before MongoDB was ready,
 * the first requests would fail with "MongoNotConnectedError".
 * Connecting first ensures the server is fully ready before
 * announcing itself available.
 */
const start = async () => {
  try {
    // Step 1: Connect to MongoDB
    await connectDB();

    // Step 2: Start HTTP server
    const server = app.listen(config.port, () => {
      console.log('');
      console.log('  🚀 CodeMate server started');
      console.log(`  📍 URL:         http://localhost:${config.port}`);
      console.log(`  🏥 Health:      http://localhost:${config.port}/api/health`);
      console.log(`  🌍 Environment: ${config.nodeEnv}`);
      console.log('');
    });

    // Step 3: Initialize Socket.IO server
    const { initSocket } = require('./sockets/socket');
    initSocket(server);

    // ── Graceful Shutdown ────────────────────────────────────────────────────
    // When Docker stops the container or Ctrl+C is pressed:
    // 1. Stop accepting new connections
    // 2. Wait for in-flight requests to finish
    // 3. Close MongoDB connection cleanly
    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        console.log('✅ HTTP server closed');
        await disconnectDB();
        process.exit(0);
      });

      // Force exit if graceful shutdown takes too long
      setTimeout(() => {
        console.error('❌ Forced exit after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM')); // Docker stop
    process.on('SIGINT', () => shutdown('SIGINT'));   // Ctrl+C

  } catch (err) {
    console.error('❌ Server failed to start:', err.message);
    process.exit(1);
  }
};

start();
