const request = require('supertest');
const app = require('../src/app');

describe('Chat Room API', () => {
  let authToken;
  let chatroomId;

  beforeAll(async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@mindconnect.com',
        password: 'Admin@123'
      });
    
    authToken = response.body.data.token;
  });

  describe('GET /api/chatrooms', () => {
    test('Should get all chat rooms', async () => {
      const response = await request(app)
        .get('/api/chatrooms')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      if (response.body.data.length > 0) {
        chatroomId = response.body.data[0].id;
      }
    });
  });

  describe('POST /api/chatrooms/:id/join', () => {
    test('Should join chat room', async () => {
      if (!chatroomId) {
        console.log('Skipping: No chat room available');
        return;
      }

      const response = await request(app)
        .post(`/api/chatrooms/${chatroomId}/join`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/chatrooms/:id/messages', () => {
    test('Should get chat room messages', async () => {
      if (!chatroomId) {
        console.log('Skipping: No chat room available');
        return;
      }

      const response = await request(app)
        .get(`/api/chatrooms/${chatroomId}/messages`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});