'use strict';

const { validationResult } = require('express-validator');

/**
 * validate — collects express-validator errors and sends a 400 response.
 *
 * HOW IT WORKS:
 * express-validator runs validation rules BEFORE this middleware.
 * Rules are defined like this:
 *
 *   const rules = [
 *     body('email').isEmail().withMessage('Invalid email'),
 *     body('password').isLength({ min: 8 }).withMessage('Min 8 chars'),
 *   ];
 *
 * In the route:
 *   router.post('/register', rules, validate, authController.register);
 *
 * The rules run first, collect errors internally, then validate() checks
 * for those errors. If any exist, it responds immediately — the controller
 * never runs. This keeps controllers clean.
 *
 * RESPONSE FORMAT (on failure):
 * {
 *   "success": false,
 *   "message": "Validation failed",
 *   "errors": [
 *     { "field": "email", "message": "Invalid email" },
 *     { "field": "password", "message": "Min 8 chars" }
 *   ]
 * }
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }

  next();
};

module.exports = validate;
