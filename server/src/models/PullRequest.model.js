'use strict';

const mongoose = require('mongoose');

/**
 * PullRequest Model
 *
 * Stores a snapshot of PR metadata when a user views or reviews a PR.
 * The actual code diff is always fetched fresh from GitHub at review time —
 * we don't store diffs because they can be megabytes in size and go stale.
 *
 * COMPOUND UNIQUE INDEX:
 * { repositoryId, githubPullRequestId } — a PR can only be stored once per repo.
 */
const PullRequestSchema = new mongoose.Schema(
  {
    repositoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Repository',
      required: true,
    },
    githubPullRequestId: {
      type: Number,
      required: true,
    },
    // The PR number shown on GitHub (e.g. #42)
    number: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String, // GitHub username of the PR author
      trim: true,
    },
    state: {
      type: String,
      enum: ['open', 'closed', 'merged'],
      default: 'open',
    },
    sourceBranch: {
      type: String, // "feature/login"
      trim: true,
    },
    targetBranch: {
      type: String, // "main"
      trim: true,
    },
    url: {
      type: String, // GitHub URL to the PR
    },
  },
  {
    timestamps: true,
  },
);

PullRequestSchema.index({ repositoryId: 1, githubPullRequestId: 1 }, { unique: true });

module.exports = mongoose.model('PullRequest', PullRequestSchema);
