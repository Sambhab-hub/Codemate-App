'use strict';

const githubService = require('../services/github.service');
const asyncHandler = require('../utils/asyncHandler');
const config = require('../config/env');
const AppError = require('../utils/AppError');

const User = require('../models/User.model');
const authService = require('../services/auth.service');

const getAuthUrl = asyncHandler(async (req, res) => {
  const userId = req.user?.userId || 'guest';

  if (!config.github.clientId) {
    throw new AppError('GitHub OAuth is not configured on the server. Missing GITHUB_CLIENT_ID.', 500);
  }

  const url = githubService.getAuthorizationUrl(userId);

  if (req.headers.accept?.includes('application/json') || req.headers['x-requested-with'] === 'XMLHttpRequest') {
    return res.json({
      success: true,
      data: { url },
    });
  }

  res.redirect(url);
});

const callback = asyncHandler(async (req, res) => {
  const { code, state: stateParam, error } = req.query;

  if (error) {
    return res.redirect(`${config.clientUrl}/login?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.redirect(`${config.clientUrl}/login?error=Invalid_callback_params`);
  }

  try {

    const { accessToken, scope } = await githubService.exchangeCodeForToken(code);

    const profile = await githubService.getGitHubUserProfile(accessToken);

    const GitHubConnection = require('../models/GitHubConnection.model');

    const existingConnection = await GitHubConnection.findOne({
      githubUserId: profile.githubUserId,
    });

    let userId = stateParam;

    if (existingConnection) {
      userId = existingConnection.userId.toString();
      const user = await User.findById(userId);
      if (user) {

        await GitHubConnection.findOneAndUpdate(
          { githubUserId: profile.githubUserId },
          { accessToken, scopes: scope, githubAvatarUrl: profile.githubAvatarUrl },
        );

        const refreshToken = authService.generateRefreshToken(user);
        authService.setRefreshTokenCookie(res, refreshToken);
        return res.redirect(`${config.clientUrl}/dashboard?status=connected`);
      } else {

        await GitHubConnection.deleteOne({ _id: existingConnection._id });
        userId = 'guest';
      }
    }

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

      const refreshToken = authService.generateRefreshToken(user);
      authService.setRefreshTokenCookie(res, refreshToken);
    }

    await githubService.saveGitHubConnection(userId, {
      accessToken,
      scope,
      ...profile,
    });

    res.redirect(`${config.clientUrl}/dashboard?status=connected`);
  } catch (err) {
    console.error('GitHub OAuth Callback Error:', err.message);
    res.redirect(`${config.clientUrl}/login?error=${encodeURIComponent(err.message)}`);
  }
});

const getStatus = asyncHandler(async (req, res) => {
  const status = await githubService.getConnectionStatus(req.user.userId);
  res.json({
    success: true,
    data: status,
  });
});

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
