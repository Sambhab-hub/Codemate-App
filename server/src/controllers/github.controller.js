'use strict';

const githubService = require('../services/github.service');
const asyncHandler = require('../utils/asyncHandler');
const config = require('../config/env');
const AppError = require('../utils/AppError');

/**
 * GitHub Controllers — HTTP layer for GitHub integration.
 */

const User = require('../models/User.model');
const authService = require('../services/auth.service');

// GET /api/github/auth — Returns or redirects to GitHub OAuth authorization URL
const getAuthUrl = asyncHandler(async (req, res) => {
  const userId = req.user?.userId || 'guest';

  if (!config.github.clientId) {
    throw new AppError('GitHub OAuth is not configured on the server. Missing GITHUB_CLIENT_ID.', 500);
  }

  const url = githubService.getAuthorizationUrl(userId);

  // If request accepts JSON or is XHR API call
  if (req.headers.accept?.includes('application/json') || req.headers['x-requested-with'] === 'XMLHttpRequest') {
    return res.json({
      success: true,
      data: { url },
    });
  }

  // Direct browser window navigation (from Login page "Continue with GitHub" button)
  res.redirect(url);
});

// GET /api/github/callback — OAuth Callback endpoint registered with GitHub
const callback = asyncHandler(async (req, res) => {
  const { code, state: stateParam, error } = req.query;

  if (error) {
    return res.redirect(`${config.clientUrl}/login?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.redirect(`${config.clientUrl}/login?error=Invalid_callback_params`);
  }

  try {
    // 1. Exchange code for access token
    const { accessToken, scope } = await githubService.exchangeCodeForToken(code);

    // 2. Fetch GitHub profile
    const profile = await githubService.getGitHubUserProfile(accessToken);

    const GitHubConnection = require('../models/GitHubConnection.model');

    // 3. Check if this GitHub account is already linked to ANY CodeMate user
    const existingConnection = await GitHubConnection.findOne({
      githubUserId: profile.githubUserId,
    });

    let userId = stateParam;

    if (existingConnection) {
      // GitHub account already linked → just log that user in directly
      userId = existingConnection.userId.toString();
      const user = await User.findById(userId);
      if (!user) {
        return res.redirect(`${config.clientUrl}/login?error=Associated+user+not+found`);
      }

      // Refresh the GitHub access token silently
      await GitHubConnection.findOneAndUpdate(
        { githubUserId: profile.githubUserId },
        { accessToken, scopes: scope, githubAvatarUrl: profile.githubAvatarUrl },
      );

      // Issue a fresh login session
      const refreshToken = authService.generateRefreshToken(user);
      authService.setRefreshTokenCookie(res, refreshToken);
      return res.redirect(`${config.clientUrl}/dashboard?status=connected`);
    }

    // 4. No existing GitHub connection — handle Guest / OAuth Sign-Up
    if (!userId || userId === 'guest') {
      const email = `${profile.githubUsername.toLowerCase()}@github.com`;
      let user = await User.findOne({ email });

      if (!user) {
        user = new User({
          name: profile.githubUsername,
          email,
        });
        await user.save();
      }

      userId = user._id.toString();

      // Issue refresh cookie for seamless browser login
      const refreshToken = authService.generateRefreshToken(user);
      authService.setRefreshTokenCookie(res, refreshToken);
    }

    // 5. Save the new GitHub connection linked to userId
    await githubService.saveGitHubConnection(userId, {
      accessToken,
      scope,
      ...profile,
    });

    // 6. Redirect to dashboard
    res.redirect(`${config.clientUrl}/dashboard?status=connected`);
  } catch (err) {
    console.error('GitHub OAuth Callback Error:', err.message);
    res.redirect(`${config.clientUrl}/login?error=${encodeURIComponent(err.message)}`);
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
