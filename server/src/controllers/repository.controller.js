'use strict';

const repositoryService = require('../services/repository.service');
const asyncHandler = require('../utils/asyncHandler');

const getRemoteRepos = asyncHandler(async (req, res) => {
  const repos = await repositoryService.fetchRemoteGitHubRepos(req.user.userId);
  res.json({
    success: true,
    data: repos,
  });
});

const getTrackedRepos = asyncHandler(async (req, res) => {
  const repos = await repositoryService.getTrackedRepos(req.user.userId);
  res.json({
    success: true,
    data: repos,
  });
});

const trackRepo = asyncHandler(async (req, res) => {
  const repo = await repositoryService.trackRepo(req.user.userId, req.body);
  res.status(201).json({
    success: true,
    data: repo,
  });
});

const getRepoById = asyncHandler(async (req, res) => {
  const repo = await repositoryService.getTrackedRepoById(req.user.userId, req.params.id);
  res.json({
    success: true,
    data: repo,
  });
});

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
