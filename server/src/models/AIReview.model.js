'use strict';

const mongoose = require('mongoose');

const FindingSchema = new mongoose.Schema(
  {
    severity: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low', 'info'],
      required: true,
    },
    category: {
      type: String, 
      required: true,
    },
    file: {
      type: String, 
    },
    line: {
      type: Number, 
    },
    title: {
      type: String,
      required: true,
    },
    explanation: {
      type: String,
      required: true,
    },
    recommendation: {
      type: String,
      required: true,
    },
  },
  {
    _id: false, 
  },
);

const AIReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    repositoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Repository',
      required: true,
    },
    pullRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PullRequest',
    },
    pullRequestNumber: {
      type: Number,
    },

    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },

    overallScore: {
      type: Number,
      min: 0,
      max: 10,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
    },
    summary: {
      type: String,
    },
    findings: {
      type: [FindingSchema],
      default: [],
    },
    testingRecommendations: {
      type: [String],
      default: [],
    },

    jobId: {
      type: String, 
    },

    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

AIReviewSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('AIReview', AIReviewSchema);
