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
  // Demo Mode mock dashboard stats
  if (!userId || userId === '000000000000000000000000' || userId === 'demo') {
    return {
      repoCount: 3,
      openPRCount: 2,
      reviewCount: 5,
      openIssueCount: 4,
      avgScore: 8.8,
      categoryBreakdown: [
        { category: 'security', count: 4 },
        { category: 'performance', count: 6 },
        { category: 'bug', count: 2 },
        { category: 'quality', count: 8 },
        { category: 'error-handling', count: 3 },
      ],
      recentReviews: [
        {
          _id: 'demo-rev-1',
          repositoryId: { fullName: 'facebook/react' },
          pullRequestNumber: 104,
          riskLevel: 'low',
          summary: 'Refactored component state management and optimized rendering loops.',
          overallScore: 9.2,
        },
        {
          _id: 'demo-rev-2',
          repositoryId: { fullName: 'vercel/next.js' },
          pullRequestNumber: 42,
          riskLevel: 'medium',
          summary: 'Identified potential memory leak in async data fetch handler.',
          overallScore: 8.4,
        },
      ],
    };
  }

  let userObjectId = null;
  if (mongoose.Types.ObjectId.isValid(userId)) {
    userObjectId = new mongoose.Types.ObjectId(userId);
  }

  try {
    const repoIds = await getRepoIds(userId);

    // 1. Basic counts
    const [repoCount, openPRCount, reviewCount, openIssueCount] = await Promise.all([
      Repository.countDocuments({ userId }),
      PullRequest.countDocuments({ repositoryId: { $in: repoIds }, state: 'open' }),
      AIReview.countDocuments({ userId, status: 'completed' }),
      Issue.countDocuments({ repositoryId: { $in: repoIds }, state: 'open' }),
    ]);

    // 2. Average score aggregation
    let avgScore = 8.5;
    if (userObjectId) {
      const avgScoreResult = await AIReview.aggregate([
        { $match: { userId: userObjectId, status: 'completed', overallScore: { $exists: true } } },
        { $group: { _id: null, avgScore: { $avg: '$overallScore' } } },
      ]);
      if (avgScoreResult[0]?.avgScore) {
        avgScore = parseFloat(avgScoreResult[0].avgScore.toFixed(1));
      }
    }

    // 3. Category breakdown aggregation from findings
    let categoryBreakdown = [];
    if (userObjectId) {
      categoryBreakdown = await AIReview.aggregate([
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
    }

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
  } catch (err) {
    console.error('Analytics Fetch Error:', err.message);
    return {
      repoCount: 0,
      openPRCount: 0,
      reviewCount: 0,
      openIssueCount: 0,
      avgScore: 8.5,
      categoryBreakdown: [
        { category: 'security', count: 0 },
        { category: 'performance', count: 0 },
        { category: 'bug', count: 0 },
        { category: 'quality', count: 0 },
        { category: 'error-handling', count: 0 },
      ],
      recentReviews: [],
    };
  }
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
