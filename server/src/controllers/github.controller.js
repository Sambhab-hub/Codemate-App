'use strict';

const githubService = require('../services/github.service');
const asyncHandler = require('../utils/asyncHandler');
const config = require('../config/env');
const AppError = require('../utils/AppError');

/**
 * GitHub Controllers — HTTP layer for GitHub integration.
 */

// GET /api/github/auth — Returns GitHub OAuth authorization URL
const getAuthUrl = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  if (!config.github.clientId) {
    throw new AppError('GitHub OAuth is not configured on the server. Missing GITHUB_CLIENT_ID.', 500);
  }

  const url = githubService.getAuthorizationUrl(userId);
  res.json({
    success: true,
    data: { url },
  });
});

// GET /api/github/callback — OAuth Callback endpoint registered with GitHub
const callback = asyncHandler(async (req, res) => {
  const { code, state: userId, error } = req.query;

  if (error) {
    return res.redirect(`${config.clientUrl}/github?error=${encodeURIComponent(error)}`);
  }

  if (!code || !userId) {
    return res.redirect(`${config.clientUrl}/github?error=Invalid_callback_params`);
  }

  try {
    // 1. Exchange code for access token
    const { accessToken, scope } = await githubService.exchangeCodeForToken(code);

    // 2. Fetch GitHub profile
    const profile = await githubService.getGitHubUserProfile(accessToken);

    // 3. Save connection linked to userId
    await githubService.saveGitHubConnection(userId, {
      accessToken,
      scope,
      ...profile,
    });

    // 4. Redirect back to frontend client app
    res.redirect(`${config.clientUrl}/github?status=connected`);
  } catch (err) {
    console.error('GitHub OAuth Callback Error:', err.message);
    res.redirect(`${config.clientUrl}/github?error=${encodeURIComponent(err.message)}`);
  }
});

// GET /api/github/status — Returns current user's connection status
const getStatus = asyncHandler(async (req, res) => {
  const status = await githubService.getConnectionStatus(req.user.userId);
  res.json({
    success: true,
    data: status,
  });
});

// POST /api/github/disconnect — Disconnects user's GitHub connection
const disconnect = asyncHandler(async (req, res) => {
  const result = await githubService.disconnect(req.user.userId);
  res.json({
    success: true,
    message: 'GitHub connection removed successfully',
    data: result,
  });
});

module.exports = {
  getAuthUrl,
  callback,
  getStatus,
  disconnect,
};
