'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const GitHubConnection = require('../models/GitHubConnection.model');
const Repository = require('../models/Repository.model');
const PullRequest = require('../models/PullRequest.model');
const AIReview = require('../models/AIReview.model');
const Issue = require('../models/Issue.model');
const BugAnalysis = require('../models/BugAnalysis.model');
const config = require('../config/env');
const AppError = require('../utils/AppError');

/**
 * Auth Service — all authentication & account management business logic.
 */

const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user._id.toString(), email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpiry },
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user._id.toString() },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiry },
  );
};

const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'strict',
    path: '/',
  });
};

const register = async ({ name, email, password }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('This email is already registered', 409);
  }

  const user = new User({ name, email });
  await user.setPassword(password);
  await user.save();

  return user;
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+passwordHash');

  if (!user || !user.passwordHash) {
    throw new AppError('Invalid email or password', 401);
  }

  const isValid = await user.comparePassword(password);
  if (!isValid) {
    throw new AppError('Invalid email or password', 401);
  }

  return user;
};

const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError('No refresh token provided', 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
  } catch (err) {
    throw new AppError('Refresh token is invalid or expired. Please log in again.', 401);
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    throw new AppError('User no longer exists', 401);
  }

  return user;
};

// ── ACCOUNT MANAGEMENT ─────────────────────────────────────────────────────────

/**
 * Update user's profile name and email.
 */
const updateProfile = async (userId, { name, email }) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (email && email.toLowerCase() !== user.email) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new AppError('Email is already taken by another account', 409);
    }
    user.email = email.toLowerCase();
  }

  if (name) {
    user.name = name.trim();
  }

  await user.save();
  return user;
};

/**
 * Change password after verifying current password.
 */
const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user || !user.passwordHash) {
    throw new AppError('Cannot change password for OAuth-only accounts', 400);
  }

  const isValid = await user.comparePassword(currentPassword);
  if (!isValid) {
    throw new AppError('Current password is incorrect', 400);
  }

  await user.setPassword(newPassword);
  await user.save();
};

/**
 * Delete user account and cascade delete all user resources.
 */
const deleteAccount = async (userId) => {
  const repos = await Repository.find({ userId }).select('_id');
  const repoIds = repos.map((r) => r._id);

  // Cascading deletes across collections
  await Promise.all([
    User.deleteOne({ _id: userId }),
    GitHubConnection.deleteOne({ userId }),
    Repository.deleteMany({ userId }),
    PullRequest.deleteMany({ repositoryId: { $in: repoIds } }),
    AIReview.deleteMany({ userId }),
    Issue.deleteMany({ repositoryId: { $in: repoIds } }),
    BugAnalysis.deleteMany({ userId }),
  ]);
};

module.exports = {
  register,
  login,
  refreshAccessToken,
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  updateProfile,
  changePassword,
  deleteAccount,
};
