'use strict';

const repositoryService = require('../services/repository.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Repository Controllers — HTTP layer for repository management.
 */

// GET /api/repositories/github-remote — Fetch remote GitHub repos available to user
const getRemoteRepos = asyncHandler(async (req, res) => {
  const repos = await repositoryService.fetchRemoteGitHubRepos(req.user.userId);
  res.json({
    success: true,
    data: repos,
  });
});

// GET /api/repositories — Get all tracked repositories in CodeMate
const getTrackedRepos = asyncHandler(async (req, res) => {
  const repos = await repositoryService.getTrackedRepos(req.user.userId);
  res.json({
    success: true,
    data: repos,
  });
});

// POST /api/repositories — Track a new repository
const trackRepo = asyncHandler(async (req, res) => {
  const repo = await repositoryService.trackRepo(req.user.userId, req.body);
  res.status(201).json({
    success: true,
    data: repo,
  });
});

// GET /api/repositories/:id — Get details of a single tracked repository
const getRepoById = asyncHandler(async (req, res) => {
  const repo = await repositoryService.getTrackedRepoById(req.user.userId, req.params.id);
  res.json({
    success: true,
    data: repo,
  });
});

// DELETE /api/repositories/:id — Untrack a repository
const untrackRepo = asyncHandler(async (req, res) => {
  const result = await repositoryService.untrackRepo(req.user.userId, req.params.id);
  res.json({
    success: true,
    message: 'Repository untracked successfully',
    data: result,
  });
});

module.exports = {
  getRemoteRepos,
  getTrackedRepos,
  trackRepo,
  getRepoById,
  untrackRepo,
};
