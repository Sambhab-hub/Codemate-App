'use strict';

const analyticsService = require('../services/analytics.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Analytics Controllers — HTTP handlers for dashboard analytics.
 */

// GET /api/analytics/dashboard — Get aggregated dashboard metrics
const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await analyticsService.getDashboardStats(req.user.userId);
  res.json({
    success: true,
    data: stats,
  });
});

module.exports = {
  getDashboardStats,
};
