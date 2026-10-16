'use strict';

const app = require('./app');
const config = require('./config/env');
const { connectDB, disconnectDB } = require('./config/database');

const start = async () => {
  try {

    await connectDB();

    const server = app.listen(config.port, () => {
      console.log('');
      console.log('  🚀 CodeMate server started');
      console.log(`  📍 URL:         http://localhost:${config.port}`);
      console.log(`  🏥 Health:      http://localhost:${config.port}/api/health`);
      console.log(`  🌍 Environment: ${config.nodeEnv}`);
      console.log('');
    });

    const { initSocket } = require('./sockets/socket');
    initSocket(server);

    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        console.log('✅ HTTP server closed');
        await disconnectDB();
        process.exit(0);
      });

      setTimeout(() => {
        console.error('❌ Forced exit after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM')); 
    process.on('SIGINT', () => shutdown('SIGINT'));   

  } catch (err) {
    console.error('❌ Server failed to start:', err.message);
    process.exit(1);
  }
};

start();
