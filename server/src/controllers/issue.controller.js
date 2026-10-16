'use strict';

const issueService = require('../services/issue.service');
const asyncHandler = require('../utils/asyncHandler');

const syncRepoIssues = asyncHandler(async (req, res) => {
  const { repositoryId } = req.params;
  const { state } = req.query;
  const issues = await issueService.syncRepoIssues(req.user.userId, repositoryId, state || 'open');
  res.json({
    success: true,
    data: issues,
  });
});

const getIssues = asyncHandler(async (req, res) => {
  const { repositoryId, state } = req.query;
  const issues = await issueService.getIssues(req.user.userId, { repositoryId, state });
  res.json({
    success: true,
    data: issues,
  });
});

const getIssueById = asyncHandler(async (req, res) => {
  const issue = await issueService.getIssueById(req.user.userId, req.params.id);
  res.json({
    success: true,
    data: issue,
  });
});

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
