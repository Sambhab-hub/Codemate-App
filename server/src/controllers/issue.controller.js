'use strict';

const issueService = require('../services/issue.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Issue Controllers — HTTP handlers for GitHub issues.
 */

// POST /api/issues/sync/:repositoryId — Sync issues from GitHub for a repo
const syncRepoIssues = asyncHandler(async (req, res) => {
  const { repositoryId } = req.params;
  const { state } = req.query;
  const issues = await issueService.syncRepoIssues(req.user.userId, repositoryId, state || 'open');
  res.json({
    success: true,
    data: issues,
  });
});

// GET /api/issues — Get stored issues with optional filters
const getIssues = asyncHandler(async (req, res) => {
  const { repositoryId, state } = req.query;
  const issues = await issueService.getIssues(req.user.userId, { repositoryId, state });
  res.json({
    success: true,
    data: issues,
  });
});

// GET /api/issues/:id — Get details of a single issue
const getIssueById = asyncHandler(async (req, res) => {
  const issue = await issueService.getIssueById(req.user.userId, req.params.id);
  res.json({
    success: true,
    data: issue,
  });
});

// POST /api/issues/:id/analyze — Analyze a GitHub issue with AI
const analyzeIssue = asyncHandler(async (req, res) => {
  const analysis = await issueService.analyzeIssueWithAI(req.user.userId, req.params.id);
  res.status(201).json({
    success: true,
    message: 'Issue analyzed with AI successfully',
    data: analysis,
  });
});

module.exports = {
  syncRepoIssues,
  getIssues,
  getIssueById,
  analyzeIssue,
};
