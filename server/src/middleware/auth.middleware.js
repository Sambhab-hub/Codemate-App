'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * authenticate — protects routes that require a logged-in user.
 *
 * HOW IT WORKS:
 * 1. Reads the Authorization header: "Bearer eyJ..."
 * 2. Extracts the token after "Bearer "
 * 3. Verifies the signature with JWT_SECRET
 * 4. Attaches decoded payload to req.user for use in controllers
 * 5. Any error (expired, malformed, missing) → caught by errorHandler
 *
 * WHAT req.user CONTAINS:
 * { userId: "64abc...", email: "john@example.com", iat: ..., exp: ... }
 *
 * USAGE in routes:
 *   router.get('/me', authenticate, authController.getMe);
 *
 * INTERVIEW ANSWER:
 * "The auth middleware extracts the JWT from the Authorization header,
 *  verifies it with the secret key, and puts the decoded user info on req.user.
 *  If the token is missing or expired, it throws an error that Express passes
 *  to the global error handler, which returns a 401."
 */
const DEMO_USER = {
  userId: '000000000000000000000000',
  email: 'demo@codemate.dev',
  name: 'Demo User',
};

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please log in.',
    });
  }

  const token = authHeader.split(' ')[1];

  // Support demo mode without throwing 401
  if (token === 'demo-token') {
    req.user = DEMO_USER;
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (err) {
    next(err);
  }
};

const optionalAuthenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    if (token === 'demo-token') {
      req.user = DEMO_USER;
      return next();
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = decoded;
    } catch (err) {
      // Ignore token verification errors in optional authentication
    }
  }

  next();
};

module.exports = { authenticate, optionalAuthenticate };
