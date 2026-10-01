'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Authentication Middleware — protects routes that require a logged-in user.
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
