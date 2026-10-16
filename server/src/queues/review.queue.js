'use strict';

const { Queue } = require('bullmq');
const { redisClient, getIsRedisConnected } = require('../config/redis');

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

const addReviewJob = async (data) => {
  if (reviewQueue && getIsRedisConnected()) {
    const job = await reviewQueue.add('analyze-pr-job', data);
    return job.id;
  }
  return null; 
};

module.exports = {
  reviewQueue,
  addReviewJob,
};
