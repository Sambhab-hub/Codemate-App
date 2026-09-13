'use strict';

/**
 * Global Express Error Handler
 *
 * HOW IT WORKS:
 * Express identifies this as an error handler because it has FOUR arguments
 * (err, req, res, next). Any time next(error) is called anywhere in the app,
 * Express skips all regular middleware and routes, and comes here.
 *
 * This is the ONLY place we send error responses — no other file calls res.json()
 * on errors. This keeps error formatting consistent across the entire API.
 *
 * RESPONSE FORMAT (always):
 *   { success: false, message: "What went wrong" }
 *
 * SECURITY: We never send stack traces in production — they reveal implementation
 * details that attackers can exploit.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';

  // ── Mongoose: validation failed (e.g. required field missing) ──────────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // ── Mongoose: duplicate key (e.g. email already registered) ───────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `${field} is already taken`;
  }

  // ── Mongoose: invalid ObjectId (e.g. /api/users/not-an-id) ────────────────
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // ── JWT: signature wrong or token malformed ────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }

  // ── JWT: token has expired ─────────────────────────────────────────────────
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please log in again.';
  }

  // Build the response
  const response = {
    success: false,
    message,
  };

  // Include stack trace only during development (never in production)
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  // Log server errors (5xx) — client errors (4xx) are not logged
  if (statusCode >= 500) {
    console.error(`[ERROR] ${req.method} ${req.url}:`, err);
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
