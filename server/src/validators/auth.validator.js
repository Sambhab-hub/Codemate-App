'use strict';

const { body } = require('express-validator');

/**
 * Validation rules for auth endpoints.
 *
 * These arrays of rules are passed directly to the route definition:
 *   router.post('/register', registerRules, validate, authController.register);
 *
 * express-validator runs each rule, collects errors internally,
 * then our validate middleware checks for those errors.
 * If any rule fails, the controller never runs.
 */

const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(), // converts "John@GMAIL.com" → "john@gmail.com"

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
];

const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

module.exports = { registerRules, loginRules };
