'use strict';

const express = require('express');
const { verifyGitHubWebhook } = require('../middleware/webhookSecret');
const webhookController = require('../controllers/webhook.controller');

const router = express.Router();

router.post('/github', verifyGitHubWebhook, webhookController.handleGitHubWebhook);

module.exports = router;
