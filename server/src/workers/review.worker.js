'use strict';

const { Worker } = require('bullmq');
const { redisClient } = require('../config/redis');
const AIReview = require('../models/AIReview.model');
const pullRequestService = require('../services/pullRequest.service');
const aiService = require('../services/ai.service');

/**
 * BullMQ Worker — processes background AI Code Review jobs.
 */

const processReviewJob = async (job) => {
  const { reviewId, userId, pullRequestId } = job.data;
  console.log(`⚙️  [Worker] Processing review job #${job.id} for Review ID: ${reviewId}`);

  const review = await AIReview.findById(reviewId);
  if (!review) {
    throw new Error(`Review document ${reviewId} not found.`);
  }

  review.status = 'processing';
  await review.save();

  try {
    const pr = await pullRequestService.getPullRequestById(userId, pullRequestId);
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
    
    // Emit real-time event to user's browser via Socket.IO
    const { emitToUser } = require('../sockets/socket');
    emitToUser(userId, 'review:completed', {
      reviewId,
      pullRequestId,
      overallScore: aiResults.overallScore,
      riskLevel: aiResults.riskLevel,
      summary: aiResults.summary,
    });

    console.log(`✅ [Worker] Review job #${job.id} completed successfully.`);
    return { success: true, reviewId };
  } catch (err) {
    review.status = 'failed';
    review.errorMessage = err.message;
    await review.save();
    console.error(`❌ [Worker] Review job #${job.id} failed:`, err.message);
    throw err;
  }
};

let reviewWorker = null;

if (redisClient) {
  try {
    reviewWorker = new Worker('ai-review-queue', processReviewJob, {
      connection: redisClient,
      concurrency: 5, // Process up to 5 review jobs concurrently
    });

    reviewWorker.on('completed', (job) => {
      console.log(`🎉 Job ${job.id} completed`);
    });

    reviewWorker.on('failed', (job, err) => {
      console.error(`❌ Job ${job.id} failed with error: ${err.message}`);
    });
  } catch (err) {
    console.warn('⚠️  BullMQ worker initialization skipped:', err.message);
  }
}

module.exports = {
  reviewWorker,
  processReviewJob,
};
