'use strict';

const mongoose = require('mongoose');

/**
 * BugAnalysis Model
 *
 * Stores the result of the AI Bug Assistant.
 * The user describes a bug in plain text, the AI returns structured analysis.
 *
 * WHY STORE IT?
 * - User can reference past analyses
 * - Dashboard can show "recent bug analyses"
 * - Good data to show in demos
 */
const BugAnalysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // What the user typed
    description: {
      type: String,
      required: [true, 'Bug description is required'],
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },

    // ── AI Response Fields ─────────────────────────────────────────────────────
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
    },
    possibleCause: {
      type: String,
    },
    explanation: {
      type: String,
    },
    recommendedFix: {
      type: String,
    },
    recommendedTests: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('BugAnalysis', BugAnalysisSchema);
