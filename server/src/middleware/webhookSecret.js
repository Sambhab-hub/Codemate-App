'use strict';

const crypto = require('crypto');
const config = require('../config/env');
const AppError = require('../utils/AppError');

/**
 * Middleware to verify GitHub Webhook HMAC-SHA256 signatures.
 *
 * SECURITY:
 * GitHub signs every webhook payload using your GITHUB_WEBHOOK_SECRET
 * and sends the signature in the `X-Hub-Signature-256` header.
 * Verifying this prevents malicious actors from forging fake PR events.
 */
const verifyGitHubWebhook = (req, res, next) => {
  const secret = config.github.webhookSecret;

  // If no secret configured in dev mode, skip signature check with warning
  if (!secret) {
    console.warn('⚠️  GITHUB_WEBHOOK_SECRET not set — skipping webhook signature verification in dev mode');
    return next();
  }

  const signature = req.headers['x-hub-signature-256'];
  if (!signature) {
    return next(new AppError('No X-Hub-Signature-256 header provided', 401));
  }

  // Calculate HMAC digest over raw request body
  const payload = JSON.stringify(req.body);
  const hmac = crypto.createHmac('sha256', secret);
  const digest = `sha256=${hmac.update(payload).digest('hex')}`;

  // Timing-safe buffer comparison to prevent timing attacks
  const checksum = Buffer.from(signature, 'utf8');
  const expected = Buffer.from(digest, 'utf8');

  if (checksum.length !== expected.length || !crypto.timingSafeEqual(checksum, expected)) {
    return next(new AppError('Invalid webhook signature', 401));
  }

  next();
};

module.exports = { verifyGitHubWebhook };
