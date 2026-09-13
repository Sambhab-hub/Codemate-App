'use strict';

const axios = require('axios');
const config = require('../config/env');
const GitHubConnection = require('../models/GitHubConnection.model');
const AppError = require('../utils/AppError');

/**
 * GitHub Service — handles GitHub OAuth & API integration.
 *
 * GITHUB OAUTH FLOW:
 * 1. User clicks "Connect GitHub" → redirected to getAuthorizationUrl()
 * 2. User authorizes app on GitHub → GitHub redirects to callback with a temporary `code`
 * 3. Server calls exchangeCodeForToken(code) → gets GitHub access token
 * 4. Server calls getGitHubUserProfile(token) → gets GitHub user ID, username, avatar
 * 5. Server stores or updates GitHubConnection document linked to userId
 */

/**
 * Generate GitHub OAuth Authorization URL
 *
 * SCOPES REQUIRED:
 * - `repo`: Full control of private repositories (read/write PRs, issues, commits)
 * - `user`: Read user profile data
 */
const getAuthorizationUrl = (userId) => {
  const params = new URLSearchParams({
    client_id: config.github.clientId,
    redirect_uri: config.github.callbackUrl,
    scope: 'repo user',
    state: userId, // Pass userId as state to maintain context through OAuth redirect
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
};

/**
 * Exchange temporary OAuth code for GitHub access token.
 */
const exchangeCodeForToken = async (code) => {
  try {
    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: config.github.clientId,
        client_secret: config.github.clientSecret,
        code,
        redirect_uri: config.github.callbackUrl,
      },
      {
        headers: {
          Accept: 'application/json',
        },
      },
    );

    if (response.data.error) {
      throw new AppError(`GitHub OAuth error: ${response.data.error_description || response.data.error}`, 400);
    }

    return {
      accessToken: response.data.access_token,
      scope: response.data.scope ? response.data.scope.split(',') : ['repo', 'user'],
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(`Failed to exchange code for GitHub token: ${err.message}`, 500);
  }
};

/**
 * Fetch authenticated GitHub user profile using access token.
 */
const getGitHubUserProfile = async (accessToken) => {
  try {
    const response = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'CodeMate-App',
      },
    });

    return {
      githubUserId: String(response.data.id),
      githubUsername: response.data.login,
      githubAvatarUrl: response.data.avatar_url,
    };
  } catch (err) {
    throw new AppError(`Failed to fetch GitHub user profile: ${err.message}`, 500);
  }
};

/**
 * Save or update GitHub connection in database.
 */
const saveGitHubConnection = async (userId, { accessToken, scope, githubUserId, githubUsername, githubAvatarUrl }) => {
  // Check if this GitHub account is already connected to another user
  const existingOther = await GitHubConnection.findOne({
    githubUserId,
    userId: { $ne: userId },
  });

  if (existingOther) {
    throw new AppError('This GitHub account is already linked to another CodeMate account.', 409);
  }

  const connection = await GitHubConnection.findOneAndUpdate(
    { userId },
    {
      userId,
      githubUserId,
      githubUsername,
      githubAvatarUrl,
      accessToken,
      scopes: scope,
    },
    { upsert: true, new: true, runValidators: true },
  );

  return connection;
};

/**
 * Get GitHub connection status for a user.
 */
const getConnectionStatus = async (userId) => {
  const connection = await GitHubConnection.findOne({ userId });
  if (!connection) {
    return { connected: false };
  }

  return {
    connected: true,
    githubUsername: connection.githubUsername,
    githubAvatarUrl: connection.githubAvatarUrl,
    scopes: connection.scopes,
    createdAt: connection.createdAt,
  };
};

/**
 * Disconnect GitHub account.
 */
const disconnect = async (userId) => {
  await GitHubConnection.deleteOne({ userId });
  return { connected: false };
};

module.exports = {
  getAuthorizationUrl,
  exchangeCodeForToken,
  getGitHubUserProfile,
  saveGitHubConnection,
  getConnectionStatus,
  disconnect,
};
