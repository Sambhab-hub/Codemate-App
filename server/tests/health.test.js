'use strict';

const request = require('supertest');
const app = require('../src/app');

describe('Health API Endpoint', () => {
  it('GET /api/health should return 200 OK and database status', async () => {
    const res = await request(app).get('/api/health');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('CodeMate API is running');
    expect(res.body).toHaveProperty('database');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /api/non-existent-route should return 404 Not Found', async () => {
    const res = await request(app).get('/api/non-existent-route');

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
  });
});
