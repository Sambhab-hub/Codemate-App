'use strict';

const request = require('supertest');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/database');
const User = require('../src/models/User.model');

describe('Authentication Integration Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await User.deleteMany({ email: 'test.suite@example.com' });
    await disconnectDB();
  });

  const testUser = {
    name: 'Test Suite User',
    email: 'test.suite@example.com',
    password: 'Password123!',
  };

  it('POST /api/auth/register should create a new user account', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data).toHaveProperty('accessToken');
  });

  it('POST /api/auth/register should reject duplicate email registration with 409', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toEqual(409);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/login should authenticate valid user credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
  });

  it('POST /api/auth/login should reject incorrect password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword999!',
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
  });
});
