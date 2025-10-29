const request = require('supertest');
const app = require('../src/app');

describe('Authentication API', () => {
  let authToken;

  describe('POST /api/auth/register', () => {
    test('Should register new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: `test${Date.now()}@example.com`,
          password: 'Test123!@#',
          first_name: 'Test',
          last_name: 'User'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
    });

    test('Should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test123!@#',
          first_name: 'Test',
          last_name: 'User'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('Should fail with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak',
          first_name: 'Test',
          last_name: 'User'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('Should fail with duplicate email', async () => {
      const email = 'duplicate@example.com';
      
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'Test123!@#',
          first_name: 'Test',
          last_name: 'User'
        });

      // Duplicate registration
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'Test123!@#',
          first_name: 'Test',
          last_name: 'User'
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    test('Should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@mindconnect.com',
          password: 'Admin@123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
      
      authToken = response.body.data.token;
    });

    test('Should fail with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@mindconnect.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('Should fail with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test123!@#'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    test('Should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('Should fail without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(401);
    });
  });
});