'use strict';

/**
 * asyncHandler — wraps async Express route handlers.
 *
 * WHY THIS EXISTS:
 * Express 4 does NOT automatically catch errors thrown inside async functions.
 * If you forget to try/catch inside an async controller, a rejected Promise
 * will crash the process (unhandledRejection) instead of being caught by
 * the global error handler.
 *
 * Without asyncHandler:
 *   app.get('/users', async (req, res) => {
 *     const users = await User.find();  // if this throws, Express doesn't catch it
 *   });
 *
 * With asyncHandler:
 *   app.get('/users', asyncHandler(async (req, res) => {
 *     const users = await User.find();  // errors automatically go to next(err)
 *   }));
 *
 * This lets our global errorHandler.js handle ALL errors in one place.
 *
 * INTERVIEW ANSWER: "We use a wrapper that converts rejected promises into
 * calls to next(error), which Express then passes to the global error handler."
 *
 * @param {Function} fn - async route handler
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
