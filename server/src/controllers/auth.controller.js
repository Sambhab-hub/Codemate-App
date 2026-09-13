'use strict';

const User = require('../models/User.model');
const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Auth Controllers — HTTP layer.
 */

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const user = await authService.register({ name, email, password });

  const accessToken = authService.generateAccessToken(user);
  const refreshToken = authService.generateRefreshToken(user);

  authService.setRefreshTokenCookie(res, refreshToken);

  res.status(201).json({
    success: true,
    data: {
      user: user.toPublicJSON(),
      accessToken,
    },
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await authService.login({ email, password });

  const accessToken = authService.generateAccessToken(user);
  const refreshToken = authService.generateRefreshToken(user);

  authService.setRefreshTokenCookie(res, refreshToken);

  res.json({
    success: true,
    data: {
      user: user.toPublicJSON(),
      accessToken,
    },
  });
});

// POST /api/auth/refresh
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;

  const user = await authService.refreshAccessToken(refreshToken);

  const newAccessToken = authService.generateAccessToken(user);
  const newRefreshToken = authService.generateRefreshToken(user);

  authService.setRefreshTokenCookie(res, newRefreshToken);

  res.json({
    success: true,
    data: {
      user: user.toPublicJSON(),
      accessToken: newAccessToken,
    },
  });
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  authService.clearRefreshTokenCookie(res);

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.json({
    success: true,
    data: { user: user.toPublicJSON() },
  });
});

// PUT /api/auth/profile — Update name & email
const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const user = await authService.updateProfile(req.user.userId, { name, email });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user: user.toPublicJSON() },
  });
});

// PUT /api/auth/password — Change password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.userId, { currentPassword, newPassword });

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});

// DELETE /api/auth/account — Delete account & cascading data
const deleteAccount = asyncHandler(async (req, res) => {
  await authService.deleteAccount(req.user.userId);
  authService.clearRefreshTokenCookie(res);

  res.json({
    success: true,
    message: 'Account and associated data deleted successfully',
  });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  updateProfile,
  changePassword,
  deleteAccount,
};
