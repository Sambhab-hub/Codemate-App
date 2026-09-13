'use strict';

const axios = require('axios');
const PullRequest = require('../models/PullRequest.model');
const Repository = require('../models/Repository.model');
const GitHubConnection = require('../models/GitHubConnection.model');
const AppError = require('../utils/AppError');

/**
 * Pull Request Service — handles fetching PRs and diffs from GitHub & database.
 */

/**
 * Helper to get the user's GitHub access token from database.
 */
const getGitHubToken = async (userId) => {
  const connection = await GitHubConnection.findOne({ userId }).select('+accessToken');
  if (!connection || !connection.accessToken) {
    throw new AppError('GitHub account not connected. Please connect GitHub first.', 400);
  }
  return connection.accessToken;
};

/**
 * Sync & fetch Pull Requests for a tracked repository from GitHub.
 */
const syncRepoPullRequests = async (userId, repositoryId, state = 'open') => {
  const repo = await Repository.findOne({ _id: repositoryId, userId });
  if (!repo) {
    throw new AppError('Tracked repository not found.', 404);
  }

  const token = await getGitHubToken(userId);

  try {
    const response = await axios.get(
      `https://api.github.com/repos/${repo.owner}/${repo.name}/pulls`,
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

    const syncedPRs = [];

    for (const prData of response.data) {
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
      syncedPRs.push(pr);
    }

    return syncedPRs;
  } catch (err) {
    if (err.response?.status === 401) {
      throw new AppError('GitHub access token expired or revoked. Please reconnect GitHub.', 401);
    }
    throw new AppError(`Failed to fetch pull requests from GitHub: ${err.message}`, 500);
  }
};

/**
 * Get stored Pull Requests from database with optional filters.
 */
const getPullRequests = async (userId, { repositoryId, state }) => {
  // Find all repos owned by this user
  const userRepos = await Repository.find({ userId }).select('_id');
  const repoIds = userRepos.map((r) => r._id);

  const query = { repositoryId: { $in: repoIds } };

  if (repositoryId) {
    query.repositoryId = repositoryId;
  }

  if (state && state !== 'all') {
    query.state = state;
  }

  return PullRequest.find(query)
    .populate('repositoryId', 'name owner fullName language isPrivate')
    .sort({ updatedAt: -1 });
};

/**
 * Get details of a single Pull Request by ID.
 */
const getPullRequestById = async (userId, pullRequestId) => {
  const pr = await PullRequest.findById(pullRequestId).populate('repositoryId');
  if (!pr) {
    throw new AppError('Pull request not found.', 404);
  }

  // Verify repo belongs to user
  if (pr.repositoryId.userId.toString() !== userId) {
    throw new AppError('Access denied.', 403);
  }

  return pr;
};

/**
 * Fetch changed files and diff patches for a specific Pull Request from GitHub API.
 */
const getPullRequestFiles = async (userId, pullRequestId) => {
  const pr = await getPullRequestById(userId, pullRequestId);
  const repo = pr.repositoryId;
  const token = await getGitHubToken(userId);

  try {
    const response = await axios.get(
      `https://api.github.com/repos/${repo.owner}/${repo.name}/pulls/${pr.number}/files`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'CodeMate-App',
        },
        params: {
          per_page: 100,
        },
      },
    );

    return response.data.map((file) => ({
      filename: file.filename,
      status: file.status, // 'added', 'modified', 'removed', 'renamed'
      additions: file.additions,
      deletions: file.deletions,
      changes: file.changes,
      patch: file.patch || '', // Git unified diff patch snippet
      rawUrl: file.raw_url,
    }));
  } catch (err) {
    throw new AppError(`Failed to fetch pull request files from GitHub: ${err.message}`, 500);
  }
};

module.exports = {
  syncRepoPullRequests,
  getPullRequests,
  getPullRequestById,
  getPullRequestFiles,
};
