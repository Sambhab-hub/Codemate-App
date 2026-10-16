'use strict';

const mongoose = require('mongoose');

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

IssueSchema.index({ repositoryId: 1, githubIssueId: 1 }, { unique: true });

module.exports = mongoose.model('Issue', IssueSchema);
