'use strict';

const mongoose = require('mongoose');

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

RepositorySchema.index({ userId: 1, githubRepositoryId: 1 }, { unique: true });

module.exports = mongoose.model('Repository', RepositorySchema);
