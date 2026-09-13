'use strict';

const { Queue } = require('bullmq');
const { redisClient, getIsRedisConnected } = require('../config/redis');

/**
 * BullMQ Review Queue — manages background job dispatch for AI Code Reviews.
 */

let reviewQueue = null;

if (redisClient) {
  try {
    reviewQueue = new Queue('ai-review-queue', {
      connection: redisClient,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    });
  } catch (err) {
    console.warn('⚠️  BullMQ queue creation skipped:', err.message);
  }
}

/**
 * Add an AI Review job to the queue.
 */
const addReviewJob = async (data) => {
  if (reviewQueue && getIsRedisConnected()) {
    const job = await reviewQueue.add('analyze-pr-job', data);
    return job.id;
  }
  return null; // Signals controller to execute directly if Redis is not active
};

module.exports = {
  reviewQueue,
  addReviewJob,
};
