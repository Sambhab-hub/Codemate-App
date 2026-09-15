'use strict';

const rateLimit = require('express-rate-limit');

/**
 * Rate Limiters
 *
 * WHY RATE LIMITING?
 * Without it, anyone can hammer your API:
 *  - Brute-force login passwords (try 1 million passwords per second)
 *  - Abuse expensive AI endpoints (each OpenAI call costs real money)
 *  - Bring down your server with a simple for-loop script
 *
 * HOW IT WORKS:
 * express-rate-limit counts requests per IP address in a time window.
 * If the count exceeds `max`, it returns 429 Too Many Requests.
 * The counter resets after `windowMs` milliseconds.
 *
 * WE HAVE 3 LIMITERS FOR DIFFERENT SENSITIVITY:
 *
 * globalLimiter  — applied to all /api routes (100 req / 15 min)
 * authLimiter    — applied to /api/auth routes (10 req / 15 min)
 *                  Prevents password brute-forcing
 * aiLimiter      — applied to /api/ai routes (10 req / 1 min)
 *                  Prevents expensive OpenAI API abuse
 */

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
  standardHeaders: true,  // Returns rate limit info in RateLimit-* headers
  legacyHeaders: false,   // Don't use the old X-RateLimit-* headers
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Allow up to 100 auth attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 AI requests per minute
  message: {
    success: false,
    message: 'AI rate limit exceeded. Please wait a moment before making more AI requests.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { globalLimiter, authLimiter, aiLimiter };
