'use strict';

const mongoose = require('mongoose');
const Repository = require('../models/Repository.model');
const PullRequest = require('../models/PullRequest.model');
const AIReview = require('../models/AIReview.model');
const Issue = require('../models/Issue.model');

/**
 * Analytics Service — handles platform metric aggregation and dashboard statistics.
 */

const getDashboardStats = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // 1. Basic counts
  const [repoCount, openPRCount, reviewCount, openIssueCount] = await Promise.all([
    Repository.countDocuments({ userId }),
    PullRequest.countDocuments({ repositoryId: { $in: await getRepoIds(userId) }, state: 'open' }),
    AIReview.countDocuments({ userId, status: 'completed' }),
    Issue.countDocuments({ repositoryId: { $in: await getRepoIds(userId) }, state: 'open' }),
  ]);

  // 2. Average score aggregation
  const avgScoreResult = await AIReview.aggregate([
    { $match: { userId: userObjectId, status: 'completed', overallScore: { $exists: true } } },
    { $group: { _id: null, avgScore: { $avg: '$overallScore' } } },
  ]);

  const avgScore = avgScoreResult[0]?.avgScore ? parseFloat(avgScoreResult[0].avgScore.toFixed(1)) : 8.5;

  // 3. Category breakdown aggregation from findings
  const categoryBreakdown = await AIReview.aggregate([
    { $match: { userId: userObjectId, status: 'completed' } },
    { $unwind: '$findings' },
    {
      $group: {
        _id: '$findings.category',
        count: { $sum: 1 },
      },
    },
    { $project: { category: '$_id', count: 1, _id: 0 } },
  ]);

  // Provide default structure if no findings yet
  const formattedCategoryBreakdown = [
    { category: 'security', count: getCategoryCount(categoryBreakdown, 'security') },
    { category: 'performance', count: getCategoryCount(categoryBreakdown, 'performance') },
    { category: 'bug', count: getCategoryCount(categoryBreakdown, 'bug') },
    { category: 'quality', count: getCategoryCount(categoryBreakdown, 'quality') },
    { category: 'error-handling', count: getCategoryCount(categoryBreakdown, 'error-handling') },
  ];

  // 4. Recent reviews
  const recentReviews = await AIReview.find({ userId, status: 'completed' })
    .populate('repositoryId', 'fullName')
    .sort({ createdAt: -1 })
    .limit(5);

  return {
    repoCount,
    openPRCount,
    reviewCount,
    openIssueCount,
    avgScore,
    categoryBreakdown: formattedCategoryBreakdown,
    recentReviews,
  };
};

const getRepoIds = async (userId) => {
  const repos = await Repository.find({ userId }).select('_id');
  return repos.map((r) => r._id);
};

const getCategoryCount = (breakdown, category) => {
  const found = breakdown.find((b) => b.category?.toLowerCase() === category.toLowerCase());
  return found ? found.count : 0;
};

module.exports = {
  getDashboardStats,
};
