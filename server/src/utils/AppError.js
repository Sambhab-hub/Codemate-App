'use strict';

/**
 * AppError — custom error class for expected HTTP errors.
 *
 * WHY A CUSTOM ERROR CLASS?
 * When we throw a normal Error, the global errorHandler gives it a 500.
 * But many errors are expected and have specific status codes:
 *   - User already exists → 409 Conflict
 *   - Wrong password → 401 Unauthorized
 *   - Resource not found → 404 Not Found
 *
 * By attaching statusCode to the error, errorHandler.js knows exactly
 * what HTTP status to send without needing any extra logic.
 *
 * USAGE:
 *   throw new AppError('Email already registered', 409);
 *   throw new AppError('Invalid credentials', 401);
 *   throw new AppError('Repository not found', 404);
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';

    // Captures where the error was thrown (useful for debugging)
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
