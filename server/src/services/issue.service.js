'use strict';

const axios = require('axios');
const Issue = require('../models/Issue.model');
const Repository = require('../models/Repository.model');
const GitHubConnection = require('../models/GitHubConnection.model');
const aiService = require('./ai.service');
const BugAnalysis = require('../models/BugAnalysis.model');
const AppError = require('../utils/AppError');

/**
 * Issue Service — handles fetching, syncing, and analyzing GitHub issues.
 */

const getGitHubToken = async (userId) => {
  const connection = await GitHubConnection.findOne({ userId }).select('+accessToken');
  if (!connection || !connection.accessToken) {
    throw new AppError('GitHub account not connected. Please connect GitHub first.', 400);
  }
  return connection.accessToken;
};

/**
 * Sync issues from GitHub for a tracked repository.
 */
const syncRepoIssues = async (userId, repositoryId, state = 'open') => {
  const repo = await Repository.findOne({ _id: repositoryId, userId });
  if (!repo) {
    throw new AppError('Tracked repository not found.', 404);
  }

  const token = await getGitHubToken(userId);

  try {
    const response = await axios.get(
      `https://api.github.com/repos/${repo.owner}/${repo.name}/issues`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'CodeMate-App',
        },
        params: {
          state, // 'open', 'closed', 'all'
          per_page: 50,
          sort: 'updated',
          direction: 'desc',
        },
      },
    );

    // GitHub's issues endpoint returns both issues and pull requests (PRs have a `pull_request` key).
    // Filter out PRs so we only store genuine issues.
    const rawIssues = response.data.filter((item) => !item.pull_request);
    const syncedIssues = [];

    for (const issueData of rawIssues) {
      const issue = await Issue.findOneAndUpdate(
        { repositoryId: repo._id, githubIssueId: issueData.id },
        {
          repositoryId: repo._id,
          githubIssueId: issueData.id,
          number: issueData.number,
          title: issueData.title,
          state: issueData.state,
          body: issueData.body || '',
          author: issueData.user ? issueData.user.login : 'unknown',
          url: issueData.html_url,
          labels: issueData.labels ? issueData.labels.map((l) => l.name) : [],
        },
        { upsert: true, new: true, runValidators: true },
      );
      syncedIssues.push(issue);
    }

    return syncedIssues;
  } catch (err) {
    if (err.response?.status === 401) {
      throw new AppError('GitHub access token expired or revoked. Please reconnect GitHub.', 401);
    }
    throw new AppError(`Failed to fetch issues from GitHub: ${err.message}`, 500);
  }
};

/**
 * Get stored issues with optional repository and state filters.
 */
const getIssues = async (userId, { repositoryId, state }) => {
  const userRepos = await Repository.find({ userId }).select('_id');
  const repoIds = userRepos.map((r) => r._id);

  const query = { repositoryId: { $in: repoIds } };

  if (repositoryId) {
    query.repositoryId = repositoryId;
  }

  if (state && state !== 'all') {
    query.state = state;
  }

  return Issue.find(query)
    .populate('repositoryId', 'name owner fullName language isPrivate')
    .sort({ updatedAt: -1 });
};

/**
 * Get single issue details.
 */
const getIssueById = async (userId, issueId) => {
  const issue = await Issue.findById(issueId).populate('repositoryId');
  if (!issue) {
    throw new AppError('Issue not found.', 404);
  }

  if (issue.repositoryId.userId.toString() !== userId) {
    throw new AppError('Access denied.', 403);
  }

  return issue;
};

/**
 * Analyze a GitHub issue using AI Bug Assistant.
 */
const analyzeIssueWithAI = async (userId, issueId) => {
  const issue = await getIssueById(userId, issueId);

  const promptText = `ISSUE #${issue.number}: ${issue.title}\n\nDESCRIPTION:\n${issue.body || 'No description provided.'}`;

  const aiResults = await aiService.analyzeBug(promptText);

  const bugAnalysis = await BugAnalysis.create({
    userId,
    description: `[GitHub Issue #${issue.number}] ${issue.title}\n${issue.body || ''}`.slice(0, 5000),
    severity: aiResults.severity,
    possibleCause: aiResults.possibleCause,
    explanation: aiResults.explanation,
    recommendedFix: aiResults.recommendedFix,
    recommendedTests: aiResults.recommendedTests,
  });

  return bugAnalysis;
};

module.exports = {
  syncRepoIssues,
  getIssues,
  getIssueById,
  analyzeIssueWithAI,
};
