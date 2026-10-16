'use strict';

const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { aiLimiter } = require('../middleware/rateLimiter');
const aiController = require('../controllers/ai.controller');

const router = express.Router();

router.use(authenticate);

router.post('/review',     aiLimiter, aiController.createPRReview);
router.get('/reviews',     aiController.getUserReviews);
router.get('/reviews/:id', aiController.getReviewById);

router.post('/bug-analysis', aiLimiter, aiController.createBugAnalysis);
router.get('/bug-analysis',  aiController.getUserBugAnalyses);

module.exports = router;
