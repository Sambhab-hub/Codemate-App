'use strict';

const mongoose = require('mongoose');

/**
 * AIReview Model — the core model of CodeMate.
 *
 * REVIEW LIFECYCLE:
 *   pending → processing → completed
 *                       → failed
 *
 * The status field drives the real-time UI:
 * - pending:    Review was requested, job created in BullMQ (Phase 13)
 * - processing: Worker picked up the job, calling GitHub + OpenAI
 * - completed:  Results stored, Socket.IO notifies frontend (Phase 15)
 * - failed:     Something went wrong, errorMessage explains what
 *
 * FINDINGS SCHEMA:
 * Each finding is an embedded subdocument (not a separate collection).
 * WHY EMBEDDED? Findings always belong to exactly one review and are always
 * fetched together. Embedding avoids an extra database query.
 *
 * SCORE:
 * overallScore is 0–10. This is a number assigned by OpenAI based on the
 * quality of the code changes. We validate it's in range before storing.
 */

const FindingSchema = new mongoose.Schema(
  {
    severity: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low', 'info'],
      required: true,
    },
    category: {
      type: String, // "security", "performance", "bug", "quality", etc.
      required: true,
    },
    file: {
      type: String, // e.g. "src/payment.js"
    },
    line: {
      type: Number, // Line number of the issue
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
    _id: false, // No separate _id for each finding — they're embedded
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

    // ── Review Status ──────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },

    // ── AI Results (populated when status = 'completed') ──────────────────────
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

    // ── Job Tracking (Phase 13 — BullMQ) ──────────────────────────────────────
    jobId: {
      type: String, // BullMQ job ID for tracking
    },

    // ── Error Info (populated when status = 'failed') ─────────────────────────
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// Index for fast queries: "show me all reviews for this user"
AIReviewSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('AIReview', AIReviewSchema);
