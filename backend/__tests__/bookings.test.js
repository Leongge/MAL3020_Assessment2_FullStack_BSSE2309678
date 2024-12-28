const request = require('supertest');
const { io: Client } = require('socket.io-client');
const app = require('../app');

describe('Bookings API Tests', () => {
  let clientSocket;

  beforeAll(async () => {
    clientSocket = Client('http://localhost:3000');
    await new Promise(resolve => clientSocket.on('connect', resolve));
  });

  afterAll(async () => {
    clientSocket.close();
    await app.close();
  });

  const sampleBooking = {
    userId: 'user123',
    flights: [{
      flightId: 'flight123',
      departureDate: '2024-12-27',
      arrivalDate: '2024-12-28',
      departureLocation: 'New York',
      arrivalLocation: 'London',
      mainPassengers: [{
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        Address: '123 Main St',
        IdentityNo: 'ID123456'
      }]
    }],
    addons: [{
      type: 'Extra Baggage',
      price: 50
    }],
    totalPrice: 500,
    additionalPassengers: [{
      id: 'pass123',
      title: 'Mr',
      name: 'Jane Doe',
      dateOfBirth: '1990-01-01',
      nationality: 'US'
    }]
  };

  describe('GET /api/bookings', () => {
    it('should return all bookings', async () => {
      const response = await request(app).get('/api/bookings');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Bookings retrieved successfully');
      expect(Array.isArray(response.body.bookings)).toBe(true);
    });

    it('should filter bookings by userId', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .query({ userId: 'user123' });
      
      expect(response.status).toBe(200);
      expect(response.body.bookings.every(b => b.userId === 'user123')).toBe(true);
    });

    it('should filter bookings by date range', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .query({ 
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        });
      
      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/bookings/:bookingId', () => {
    it('should return specific booking', async () => {
      // First create a booking
      const createResponse = await request(app)
        .post('/api/bookings')
        .send(sampleBooking);
      
      const bookingId = createResponse.body.bookingId;
      
      const response = await request(app)
        .get(`/api/bookings/${bookingId}`);
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Booking retrieved successfully');
      expect(response.body.booking._id).toBe(bookingId);

      // Cleanup
      await request(app).delete(`/api/bookings/${bookingId}`);
    });

    it('should return 404 for non-existent booking', async () => {
      const response = await request(app)
        .get('/api/bookings/nonexistent');
      
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Booking not found');
    });
  });

  describe('POST /api/bookings', () => {
    it('should create a new booking', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .send(sampleBooking);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Booking created successfully');
      expect(response.body.bookingDetails.userId).toBe(sampleBooking.userId);
      expect(response.body.bookingDetails._id).toMatch(/^booking\d+$/);

      // Cleanup
      await request(app).delete(`/api/bookings/${response.body.bookingId}`);
    });

    it('should reject booking with missing required fields', async () => {
      const invalidBooking = {
        userId: 'user123',
        // Missing flights array
        totalPrice: 500
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(invalidBooking);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Required fields are missing');
    });
  });

  describe('PUT /api/bookings/:bookingId/status', () => {
    it('should update booking status and emit socket event', async () => {
      // First create a booking
      const createResponse = await request(app)
        .post('/api/bookings')
        .send(sampleBooking);
      
      const bookingId = createResponse.body.bookingId;

      const socketPromise = new Promise(resolve => {
        clientSocket.on('bookingStatusUpdated', (data) => {
          resolve(data);
        });
      });

      const response = await request(app)
        .put(`/api/bookings/${bookingId}/status`)
        .send({ status: 'Cancelled' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Booking status updated successfully');

      const socketData = await socketPromise;
      expect(socketData.bookingId).toBe(bookingId);
      expect(socketData.newStatus).toBe('Cancelled');

      // Cleanup
      await request(app).delete(`/api/bookings/${bookingId}`);
    });

    it('should reject invalid status', async () => {
      const response = await request(app)
        .put('/api/bookings/someId/status')
        .send({ status: 'InvalidStatus' });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/Invalid status/);
    });
  });

  describe('DELETE /api/bookings/:bookingId', () => {
    it('should delete existing booking and emit socket event', async () => {
      // First create a booking
      const createResponse = await request(app)
        .post('/api/bookings')
        .send(sampleBooking);
      
      const bookingId = createResponse.body.bookingId;

      const socketPromise = new Promise(resolve => {
        clientSocket.on('bookingDeleted', (data) => {
          resolve(data);
        });
      });

      const response = await request(app)
        .delete(`/api/bookings/${bookingId}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Booking deleted successfully');

      const socketData = await socketPromise;
      expect(socketData.bookingId).toBe(bookingId);

      // Verify booking is deleted
      const getResponse = await request(app)
        .get(`/api/bookings/${bookingId}`);
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent booking', async () => {
      const response = await request(app)
        .delete('/api/bookings/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Booking not found');
    });
  });
});