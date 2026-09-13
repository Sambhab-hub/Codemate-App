'use strict';

const mongoose = require('mongoose');

/**
 * GitHubConnection Model
 *
 * WHY SEPARATE FROM USER?
 * A user might register with email/password first, then connect GitHub later.
 * Keeping GitHub data in a separate collection means:
 * - The User model stays clean (just identity)
 * - You can disconnect GitHub without affecting the User
 * - Easy to add other OAuth providers (Google, GitLab) the same way
 *
 * IMPORTANT: accessToken has select:false
 * The GitHub access token is sensitive — it grants access to the user's
 * repositories. Never return it in an API response. Only fetch it internally
 * when making GitHub API calls.
 *
 * HOW IT'S USED:
 * When making a GitHub API call:
 *   const conn = await GitHubConnection.findOne({ userId }).select('+accessToken');
 *   const octokit = new Octokit({ auth: conn.accessToken });
 */
const GitHubConnectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One GitHub connection per user
    },
    githubUserId: {
      type: String,
      required: true,
      unique: true, // One CodeMate account per GitHub account
    },
    githubUsername: {
      type: String,
      trim: true,
    },
    githubAvatarUrl: {
      type: String,
    },
    // select:false — never returned by default, only fetched when making API calls
    accessToken: {
      type: String,
      required: true,
      select: false,
    },
    // Which GitHub permissions were granted
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
