'use strict';

const mongoose = require('mongoose');

/**
 * Repository Model
 *
 * WHY NOT COPY EVERYTHING FROM GITHUB?
 * GitHub is the source of truth for source code and full repo details.
 * We only store the METADATA we need to:
 *   - Show the user a list of their connected repos
 *   - Link pull requests and AI reviews to a repo
 *   - Make GitHub API calls (we need owner + name to form API URLs)
 *
 * NEVER store:
 *   - The actual code
 *   - Full commit history
 *   - Entire pull request diffs (too large, stale quickly)
 *
 * COMPOUND UNIQUE INDEX:
 * { userId, githubRepositoryId } — the same GitHub repo can be connected by
 * different users, but one user can't add the same repo twice.
 */
const RepositorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    githubRepositoryId: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: String,
      required: true,
      trim: true,
    },
    // "owner/name" — used to construct GitHub API URLs
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    url: {
      type: String,
    },
    language: {
      type: String,
    },
    defaultBranch: {
      type: String,
      default: 'main',
    },
  },
  {
    timestamps: true,
  },
);

// Same user cannot add the same GitHub repo twice
RepositorySchema.index({ userId: 1, githubRepositoryId: 1 }, { unique: true });

module.exports = mongoose.model('Repository', RepositorySchema);
