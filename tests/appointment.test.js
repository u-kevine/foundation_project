const request = require('supertest');
const app = require('../src/app');

describe('Appointment API', () => {
  let authToken;
  let therapistId;

  beforeAll(async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@mindconnect.com',
        password: 'User@123'
      });
    
    authToken = response.body.data.token;

    // Get a therapist
    const therapistResponse = await request(app)
      .get('/api/therapists')
      .set('Authorization', `Bearer ${authToken}`);
    
    if (therapistResponse.body.data.length > 0) {
      therapistId = therapistResponse.body.data[0].id;
    }
  });

  describe('POST /api/appointments', () => {
    test('Should create appointment', async () => {
      if (!therapistId) {
        console.log('Skipping: No therapist available');
        return;
      }

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          therapist_id: therapistId,
          appointment_date: futureDate.toISOString(),
          duration: 60,
          notes: 'Test appointment'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
    });

    test('Should fail with invalid therapist', async () => {
      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          therapist_id: 99999,
          appointment_date: new Date().toISOString(),
          duration: 60
        });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/appointments/user', () => {
    test('Should get user appointments', async () => {
      const response = await request(app)
        .get('/api/appointments/user')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});