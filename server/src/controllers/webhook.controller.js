'use strict';

const Repository = require('../models/Repository.model');
const PullRequest = require('../models/PullRequest.model');
const AIReview = require('../models/AIReview.model');
const { addReviewJob } = require('../queues/review.queue');
const aiService = require('../services/ai.service');
const pullRequestService = require('../services/pullRequest.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Webhook Controller — processes incoming GitHub webhook events.
 */

// POST /api/webhooks/github
const handleGitHubWebhook = asyncHandler(async (req, res) => {
  const event = req.headers['x-github-event'];
  const payload = req.body;

  // Handle GitHub Ping event (sent when webhook is first configured)
  if (event === 'ping') {
    return res.json({
      success: true,
      message: 'GitHub webhook ping received successfully',
      zen: payload.zen,
    });
  }

  // Handle Pull Request events
  if (event === 'pull_request') {
    const { action, pull_request: prData, repository: repoData } = payload;

    console.log(`📡 [Webhook] Received PR event '${action}' for ${repoData.full_name} #${prData.number}`);

    // We automatically trigger AI review on 'opened', 'synchronize' (new commit), and 'reopened'
    if (['opened', 'synchronize', 'reopened'].includes(action)) {
      // 1. Find if this repo is tracked in CodeMate
      const repo = await Repository.findOne({ githubRepositoryId: repoData.id });
      if (!repo) {
        return res.json({
          success: true,
          message: `Repository ${repoData.full_name} is not tracked in CodeMate — ignoring webhook event.`,
        });
      }

      // 2. Upsert Pull Request record in MongoDB
      const pr = await PullRequest.findOneAndUpdate(
        { repositoryId: repo._id, githubPullRequestId: prData.id },
        {
          repositoryId: repo._id,
          githubPullRequestId: prData.id,
          number: prData.number,
          title: prData.title,
          author: prData.user ? prData.user.login : 'unknown',
          state: prData.state === 'closed' && prData.merged_at ? 'merged' : prData.state,
          sourceBranch: prData.head ? prData.head.ref : '',
          targetBranch: prData.base ? prData.base.ref : '',
          url: prData.html_url,
        },
        { upsert: true, new: true, runValidators: true },
      );

      // 3. Create initial AI review record
      const review = await AIReview.create({
        userId: repo.userId,
        repositoryId: repo._id,
        pullRequestId: pr._id,
        pullRequestNumber: pr.number,
        status: 'pending',
      });

      // 4. Dispatch job to BullMQ queue (or fallback)
      const jobId = await addReviewJob({
        reviewId: review._id.toString(),
        userId: repo.userId.toString(),
        pullRequestId: pr._id.toString(),
      });

      if (jobId) {
        review.jobId = String(jobId);
        await review.save();
        return res.status(202).json({
          success: true,
          message: 'Webhook received — AI review queued in background',
          reviewId: review._id,
          jobId,
        });
      }

      // Direct execution fallback if Redis is offline
      review.status = 'processing';
      await review.save();

      const files = await pullRequestService.getPullRequestFiles(repo.userId.toString(), pr._id.toString());
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

      return res.json({
        success: true,
        message: 'Webhook received — AI review completed',
        reviewId: review._id,
      });
    }
  }

  res.json({
    success: true,
    message: `Event '${event}' received and logged.`,
  });
});

module.exports = {
  handleGitHubWebhook,
};
