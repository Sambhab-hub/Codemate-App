'use strict';

const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const pullRequestController = require('../controllers/pullRequest.controller');

const router = express.Router();

/**
 * Pull Request Routes
 * All routes require authentication
 */

router.use(authenticate);

router.post('/sync/:repositoryId', pullRequestController.syncRepoPRs);
router.get('/',                    pullRequestController.getPullRequests);
router.get('/:id',                 pullRequestController.getPullRequestById);
router.get('/:id/files',           pullRequestController.getPullRequestFiles);

module.exports = router;
