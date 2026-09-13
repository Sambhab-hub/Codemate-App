'use strict';

const Redis = require('ioredis');
const config = require('./env');

/**
 * Redis connection configuration for BullMQ and Caching.
 */
let redisClient = null;
let isRedisConnected = false;

try {
  redisClient = new Redis(config.redis.url, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    lazyConnect: true, // Don't block application startup if Redis is offline
    retryStrategy(times) {
      if (times > 2) {
        return null; // Stop retrying after 2 attempts
      }
      return 500;
    },
  });

  redisClient.on('connect', () => {
    isRedisConnected = true;
    console.log('✅ Redis connected successfully');
  });

  // Attach silent error handler to prevent unhandled ECONNREFUSED log spam in local dev
  redisClient.on('error', () => {
    isRedisConnected = false;
  });

  // Attempt lazy background connection without crashing
  redisClient.connect().catch(() => {
    console.warn('⚠️  Redis connection unavailable — queue falling back to direct mode');
  });
} catch (err) {
  console.warn('⚠️  Redis client initialization skipped:', err.message);
}

module.exports = {
  redisClient,
  getIsRedisConnected: () => isRedisConnected,
};
