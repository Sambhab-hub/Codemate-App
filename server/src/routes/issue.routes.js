'use strict';

const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { aiLimiter } = require('../middleware/rateLimiter');
const issueController = require('../controllers/issue.controller');

const router = express.Router();

/**
 * Issue Routes — protected with authentication
 */

router.use(authenticate);

router.post('/sync/:repositoryId', issueController.syncRepoIssues);
router.get('/',                    issueController.getIssues);
router.get('/:id',                 issueController.getIssueById);
router.post('/:id/analyze',        aiLimiter, issueController.analyzeIssue);

module.exports = router;
