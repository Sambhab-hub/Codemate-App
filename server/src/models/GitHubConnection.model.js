'use strict';

const mongoose = require('mongoose');

const GitHubConnectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, 
    },
    githubUserId: {
      type: String,
      required: true,
      unique: true, 
    },
    githubUsername: {
      type: String,
      trim: true,
    },
    githubAvatarUrl: {
      type: String,
    },

    accessToken: {
      type: String,
      required: true,
      select: false,
    },

    scopes: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('GitHubConnection', GitHubConnectionSchema);
