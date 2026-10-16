'use strict';

const Redis = require('ioredis');
const config = require('./env');

let redisClient = null;
let isRedisConnected = false;

try {
  redisClient = new Redis(config.redis.url, {
    maxRetriesPerRequest: null, 
    enableReadyCheck: false,
    lazyConnect: true, 
    retryStrategy(times) {
      if (times > 2) {
        return null; 
      }
      return 500;
    },
  });

  redisClient.on('connect', () => {
    isRedisConnected = true;
    console.log('✅ Redis connected successfully');
  });

  redisClient.on('error', () => {
    isRedisConnected = false;
  });

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
