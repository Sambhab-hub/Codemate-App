'use strict';

const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const githubController = require('../controllers/github.controller');

const router = express.Router();

/**
 * GitHub Routes
 *
 * GET  /api/github/auth        - Initiates OAuth redirect (Protected)
 * GET  /api/github/callback    - Receives code from GitHub (Public callback)
 * GET  /api/github/status      - Checks GitHub connection status (Protected)
 * POST /api/github/disconnect  - Disconnects GitHub account (Protected)
 */

router.get('/auth',       authenticate, githubController.getAuthUrl);
router.get('/callback',                 githubController.callback);
router.get('/status',     authenticate, githubController.getStatus);
router.post('/disconnect', authenticate, githubController.disconnect);

module.exports = router;
