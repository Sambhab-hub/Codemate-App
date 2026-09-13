'use strict';

require('dotenv').config();

/**
 * Central configuration object.
 *
 * All other files import from here — they never read process.env directly.
 * This means:
 *  1. One place to see all config variables
 *  2. Easy to add validation later (Phase 3 adds required checks)
 *  3. Changing a variable name only requires changing it here
 */
const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/codemate',

  jwt: {
    secret: process.env.JWT_SECRET || 'codemate_dev_jwt_secret_key_change_in_production_2026',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'codemate_dev_jwt_refresh_secret_key_change_in_production_2026',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackUrl:
      process.env.GITHUB_CALLBACK_URL ||
      'http://localhost:5000/api/github/callback',
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
};

module.exports = config;
