'use strict';

const mongoose = require('mongoose');

const BugAnalysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    description: {
      type: String,
      required: [true, 'Bug description is required'],
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },

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
