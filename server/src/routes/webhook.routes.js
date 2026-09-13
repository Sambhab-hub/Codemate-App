'use strict';

const express = require('express');
const { verifyGitHubWebhook } = require('../middleware/webhookSecret');
const webhookController = require('../controllers/webhook.controller');

const router = express.Router();

/**
 * Webhook Routes — receives incoming webhook notifications from GitHub
 */

router.post('/github', verifyGitHubWebhook, webhookController.handleGitHubWebhook);

module.exports = router;
