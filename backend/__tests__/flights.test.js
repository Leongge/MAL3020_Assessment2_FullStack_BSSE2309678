const request = require('supertest');
const { io: Client } = require('socket.io-client');
const app = require('../app'); 

describe('Flight API Tests', () => {
  let clientSocket;
  
  beforeAll(async () => {
    clientSocket = Client('http://localhost:3000');
    await new Promise(resolve => clientSocket.on('connect', resolve));
  });

  afterAll(async () => {
    clientSocket.close();
    await app.close(); 
  });

  describe('GET /api/flights', () => {
    it('should return flights array', async () => {
      const response = await request(app).get('/api/flights');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/flights', () => {
    it('should create a new flight', async () => {
      const newFlight = { destination: 'London', airline: 'TestAir' };
      const response = await request(app)
        .post('/api/flights')
        .send(newFlight);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Flight created successfully');
      expect(response.body.flight.destination).toBe('London');
      expect(response.body.flight._id).toMatch(/^flight\d{3}$/);
      // Cleanup: Delete the created flight
      await request(app)
        .delete(`/api/flights/${response.body.flight._id}`);
    }); 
});

describe('PUT /api/flights/:id', () => {
    it('should update existing flight and emit socket event', async () => {
      // First create a flight to update
      const newFlight = { 
        _id: 'flight010', 
        destination: 'Paris', 
        airline: 'TestAir' 
      };
      await request(app)
        .post('/api/flights')
        .send(newFlight);

      const socketPromise = new Promise(resolve => {
        clientSocket.on('flightUpdated', (data) => {
          resolve(data);
        });
      });

      const response = await request(app)
        .put('/api/flights/flight010')
        .send({ destination: 'Madrid' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Flight updated successfully');
      
      const socketData = await socketPromise;
      expect(socketData.destination).toBe('Madrid');

      // Cleanup: Delete the test flight
      await request(app)
        .delete('/api/flights/flight010');
    });

    it('should return 404 for non-existent flight', async () => {
      const response = await request(app)
        .put('/api/flights/nonexistent')
        .send({ destination: 'Madrid' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Flight not found');
    });
  });

describe('DELETE /api/flights/:id', () => {
    it('should delete existing flight', async () => {
      // First create a flight to delete
      const newFlight = { 
        _id: 'flight002', 
        destination: 'Tokyo', 
        airline: 'TestAir' 
      };
      await request(app)
        .post('/api/flights')
        .send(newFlight);

      const response = await request(app)
        .delete('/api/flights/flight002');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Flight deleted successfully');
      expect(response.body.deletedCount).toBe(1);

      // Verify flight is deleted
      const getResponse = await request(app)
        .get('/api/flights');
      const deletedFlight = getResponse.body.find(f => f._id === 'flight002');
      expect(deletedFlight).toBeUndefined();
    });

    it('should return 404 for non-existent flight', async () => {
      const response = await request(app)
        .delete('/api/flights/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Flight not found');
    });
  });

  
});