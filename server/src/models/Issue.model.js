'use strict';

const mongoose = require('mongoose');

/**
 * Issue Model — lightweight GitHub issue metadata.
 *
 * GitHub is the source of truth for issue content.
 * We store a minimal snapshot so we can:
 * - Show issues in our dashboard without calling GitHub every time
 * - Link bug analyses to specific issues
 *
 * We refresh this data from GitHub when the user visits the Issues page.
 */
const IssueSchema = new mongoose.Schema(
  {
    repositoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Repository',
      required: true,
    },
    githubIssueId: {
      type: Number,
      required: true,
    },
    // The issue number shown on GitHub (e.g. #17)
    number: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
    body: {
      type: String,
      default: '',
    },
    author: {
      type: String,
    },
    url: {
      type: String,
    },
    labels: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

// Same issue can't be stored twice for the same repo
IssueSchema.index({ repositoryId: 1, githubIssueId: 1 }, { unique: true });

module.exports = mongoose.model('Issue', IssueSchema);
