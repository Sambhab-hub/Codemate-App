'use strict';

const express = require('express');
const { authenticate, optionalAuthenticate } = require('../middleware/auth.middleware');
const githubController = require('../controllers/github.controller');

const router = express.Router();

router.get('/auth',       optionalAuthenticate, githubController.getAuthUrl);
router.get('/callback',                         githubController.callback);
router.get('/status',     authenticate,         githubController.getStatus);
router.post('/disconnect', authenticate,         githubController.disconnect);

module.exports = router;
