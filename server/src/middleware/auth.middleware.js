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
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check header exists and has correct format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please log in.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    // jwt.verify() throws if the token is expired or the signature is invalid
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded; // { userId, email, iat, exp }
    next();
  } catch (err) {
    // JsonWebTokenError or TokenExpiredError → goes to errorHandler
    // errorHandler converts these to 401 with a readable message
    next(err);
  }
};

module.exports = { authenticate };
