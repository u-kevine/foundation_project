const request = require('supertest');
const app = require('../src/app');

describe('AI Assistant API', () => {
  let authToken;

  beforeAll(async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@mindconnect.com',
        password: 'User@123'
      });
    
    authToken = response.body.data.token;
  });

  describe('POST /api/ai/chat', () => {
    test('Should chat with AI assistant', async () => {
      const response = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Hello, I need someone to talk to'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('message');
      expect(response.body.data).toHaveProperty('conversationId');
    });

    test('Should detect crisis keywords', async () => {
      const response = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'I want to hurt myself'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.crisisDetected).toBe(true);
    });

    test('Should fail with empty message', async () => {
      const response = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: ''
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/ai/conversations', () => {
    test('Should get all conversations', async () => {
      const response = await request(app)
        .get('/api/ai/conversations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});