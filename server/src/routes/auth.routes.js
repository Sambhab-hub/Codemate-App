'use strict';

const express = require('express');
const { registerRules, loginRules } = require('../validators/auth.validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimiter');
const authController = require('../controllers/auth.controller');

const router = express.Router();

/**
 * Auth Routes
 */

router.use(authLimiter);

// Public routes
router.post('/register', registerRules, validate, authController.register);
router.post('/login',    loginRules,    validate, authController.login);
router.post('/refresh',                           authController.refresh);
router.post('/logout',                            authController.logout);

// Protected routes
router.get('/me',         authenticate, authController.getMe);
router.put('/profile',    authenticate, authController.updateProfile);
router.put('/password',   authenticate, authController.changePassword);
router.delete('/account', authenticate, authController.deleteAccount);

module.exports = router;
