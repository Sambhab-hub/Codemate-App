'use strict';

const mongoose = require('mongoose');

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
      type: String, 
      trim: true,
    },
    state: {
      type: String,
      enum: ['open', 'closed', 'merged'],
      default: 'open',
    },
    sourceBranch: {
      type: String, 
      trim: true,
    },
    targetBranch: {
      type: String, 
      trim: true,
    },
    url: {
      type: String, 
    },
  },
  {
    timestamps: true,
  },
);

PullRequestSchema.index({ repositoryId: 1, githubPullRequestId: 1 }, { unique: true });

module.exports = mongoose.model('PullRequest', PullRequestSchema);
