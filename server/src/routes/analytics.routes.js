'use strict';

const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const analyticsController = require('../controllers/analytics.controller');

const router = express.Router();

router.use(authenticate);

router.get('/dashboard', analyticsController.getDashboardStats);

module.exports = router;
