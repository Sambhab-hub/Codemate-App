'use strict';

const pullRequestService = require('../services/pullRequest.service');
const asyncHandler = require('../utils/asyncHandler');

const syncRepoPRs = asyncHandler(async (req, res) => {
  const { repositoryId } = req.params;
  const { state } = req.query;
  const prs = await pullRequestService.syncRepoPullRequests(req.user.userId, repositoryId, state || 'open');
  res.json({
    success: true,
    data: prs,
  });
});

const getPullRequests = asyncHandler(async (req, res) => {
  const { repositoryId, state } = req.query;
  const prs = await pullRequestService.getPullRequests(req.user.userId, { repositoryId, state });
  res.json({
    success: true,
    data: prs,
  });
});

const getPullRequestById = asyncHandler(async (req, res) => {
  const pr = await pullRequestService.getPullRequestById(req.user.userId, req.params.id);
  res.json({
    success: true,
    data: pr,
  });
});

const getPullRequestFiles = asyncHandler(async (req, res) => {
  const files = await pullRequestService.getPullRequestFiles(req.user.userId, req.params.id);
  res.json({
    success: true,
    data: files,
  });
});

module.exports = {
  syncRepoPRs,
  getPullRequests,
  getPullRequestById,
  getPullRequestFiles,
};
