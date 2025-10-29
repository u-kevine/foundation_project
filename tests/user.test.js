const request = require('supertest');
const app = require('../src/app');

describe('User API', () => {
  let authToken;

  beforeAll(async () => {
    // Login to get token
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@mindconnect.com',
        password: 'Admin@123'
      });
    
    authToken = response.body.data.token;
  });

  describe('GET /api/users/profile', () => {
    test('Should get user profile', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('email');
      expect(response.body.data).toHaveProperty('first_name');
    });

    test('Should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/users/profile');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/users/profile', () => {
    test('Should update user profile', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          first_name: 'Updated',
          last_name: 'Name'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.first_name).toBe('Updated');
    });
  });
});