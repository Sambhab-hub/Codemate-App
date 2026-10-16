'use strict';

const AIReview = require('../models/AIReview.model');
const BugAnalysis = require('../models/BugAnalysis.model');
const pullRequestService = require('../services/pullRequest.service');
const aiService = require('../services/ai.service');
const { addReviewJob } = require('../queues/review.queue');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const createPRReview = asyncHandler(async (req, res) => {
  const { pullRequestId } = req.body;
  const userId = req.user.userId;

  if (!pullRequestId) {
    throw new AppError('pullRequestId is required.', 400);
  }

  const pr = await pullRequestService.getPullRequestById(userId, pullRequestId);

  const review = await AIReview.create({
    userId,
    repositoryId: pr.repositoryId._id,
    pullRequestId: pr._id,
    pullRequestNumber: pr.number,
    status: 'pending',
  });

  const jobId = await addReviewJob({
    reviewId: review._id.toString(),
    userId,
    pullRequestId,
  });

  if (jobId) {
    review.jobId = String(jobId);
    await review.save();

    return res.status(202).json({
      success: true,
      message: 'AI Code Review job queued for background processing',
      data: review,
    });
  }

  try {
    review.status = 'processing';
    await review.save();

    const files = await pullRequestService.getPullRequestFiles(userId, pullRequestId);
    const aiResults = await aiService.analyzePRCode(
      {
        title: pr.title,
        author: pr.author,
        sourceBranch: pr.sourceBranch,
        targetBranch: pr.targetBranch,
      },
      files,
    );

    review.status = 'completed';
    review.overallScore = aiResults.overallScore;
    review.riskLevel = aiResults.riskLevel;
    review.summary = aiResults.summary;
    review.findings = aiResults.findings;
    review.testingRecommendations = aiResults.testingRecommendations;

    await review.save();

    res.status(201).json({
      success: true,
      message: 'AI Code Review completed successfully',
      data: review,
    });
  } catch (err) {
    review.status = 'failed';
    review.errorMessage = err.message;
    await review.save();
    throw err;
  }
});

const getUserReviews = asyncHandler(async (req, res) => {
  const reviews = await AIReview.find({ userId: req.user.userId })
    .populate('repositoryId', 'name owner fullName')
    .populate('pullRequestId', 'number title author state')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: reviews,
  });
});

const getReviewById = asyncHandler(async (req, res) => {
  const review = await AIReview.findOne({ _id: req.params.id, userId: req.user.userId })
    .populate('repositoryId', 'name owner fullName')
    .populate('pullRequestId', 'number title author sourceBranch targetBranch url');

  if (!review) {
    throw new AppError('AI Review not found.', 404);
  }

  res.json({
    success: true,
    data: review,
  });
});

const createBugAnalysis = asyncHandler(async (req, res) => {
  const { description } = req.body;
  const userId = req.user.userId;

  if (!description || !description.trim()) {
    throw new AppError('Bug description is required.', 400);
  }

  const aiResults = await aiService.analyzeBug(description);

  const bugAnalysis = await BugAnalysis.create({
    userId,
    description: description.trim(),
    severity: aiResults.severity,
    possibleCause: aiResults.possibleCause,
    explanation: aiResults.explanation,
    recommendedFix: aiResults.recommendedFix,
    recommendedTests: aiResults.recommendedTests,
  });

  res.status(201).json({
    success: true,
    message: 'Bug analysis completed successfully',
    data: bugAnalysis,
  });
});

const getUserBugAnalyses = asyncHandler(async (req, res) => {
  const analyses = await BugAnalysis.find({ userId: req.user.userId }).sort({ createdAt: -1 });
  res.json({
    success: true,
    data: analyses,
  });
});

module.exports = {
  createPRReview,
  getUserReviews,
  getReviewById,
  createBugAnalysis,
  getUserBugAnalyses,
};
