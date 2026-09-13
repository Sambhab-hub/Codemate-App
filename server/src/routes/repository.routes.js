'use strict';

const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const repositoryController = require('../controllers/repository.controller');

const router = express.Router();

/**
 * Repository Routes
 * All routes require authentication
 */

router.use(authenticate);

router.get('/github-remote', repositoryController.getRemoteRepos);
router.get('/',              repositoryController.getTrackedRepos);
router.post('/',             repositoryController.trackRepo);
router.get('/:id',           repositoryController.getRepoById);
router.delete('/:id',        repositoryController.untrackRepo);

module.exports = router;
