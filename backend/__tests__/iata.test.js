const request = require('supertest');
const { io: Client } = require('socket.io-client');
const { ObjectId } = require('mongodb');
const app = require('../app'); 

describe('IATA Codes API Tests', () => {
  let clientSocket;
  const sampleIataCode = {
    iataCode: 'LAX',
    airportName: 'Los Angeles International Airport',
    city: 'Los Angeles',
    country: 'United States'
  };
  
  beforeAll(async () => {
    clientSocket = Client('http://localhost:3000');
    await new Promise(resolve => clientSocket.on('connect', resolve));
  });

  afterAll(async () => {
    clientSocket.close();
    await app.close(); 
  });

  describe('GET /api/iata-codes', () => {
    it('should return array of IATA codes', async () => {
      const response = await request(app).get('/api/iata-codes');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(0);
    });
   });

   describe('POST /api/iata-codes', () => {
    it('should create a new IATA code', async () => {
      const response = await request(app)
        .post('/api/iata-codes')
        .send(sampleIataCode);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('IATA code created successfully');
      expect(response.body.iataCode).toBe(sampleIataCode.iataCode);
      expect(response.body.airportName).toBe(sampleIataCode.airportName);
      expect(response.body.city).toBe(sampleIataCode.city);
      expect(response.body.country).toBe(sampleIataCode.country);
      expect(response.body).toHaveProperty('_id');
      // Cleanup: Delete the created IATA code
      await request(app)
        .delete(`/api/iata-codes/${response.body._id}`);
    });

    it('should return 400 when required fields are missing', async () => {
      const incompleteData = {
        iataCode: 'LAX',
        airportName: 'Los Angeles International Airport'
        // Missing city and country
      };

      const response = await request(app)
        .post('/api/iata-codes')
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('All fields are required');
    });
  });

  describe('PUT /api/iata-codes/:id', () => {
    it('should update existing IATA code', async () => {
      // First create an IATA code to update
      const createResponse = await request(app)
        .post('/api/iata-codes')
        .send(sampleIataCode);

      const updateData = {
        ...sampleIataCode,
        airportName: 'Updated Airport Name'
      };

      const response = await request(app)
        .put(`/api/iata-codes/${createResponse.body._id}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('IATA code updated successfully');
      expect(response.body.airportName).toBe('Updated Airport Name');

      // Cleanup: Delete the test IATA code
      await request(app)
        .delete(`/api/iata-codes/${createResponse.body._id}`);
    });

    it('should return 404 for non-existent IATA code', async () => {
      const nonExistentId = new ObjectId();
      const response = await request(app)
        .put(`/api/iata-codes/${nonExistentId}`)
        .send(sampleIataCode);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('IATA code not found');
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .put('/api/iata-codes/invalid-id')
        .send(sampleIataCode);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid ID format');
    });
  });

  describe('DELETE /api/iata-codes/:id', () => {
    it('should delete existing IATA code', async () => {
      // First create an IATA code to delete
      const createResponse = await request(app)
        .post('/api/iata-codes')
        .send(sampleIataCode);

      const response = await request(app)
        .delete(`/api/iata-codes/${createResponse.body._id}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('IATA code deleted successfully');

      // Verify IATA code is deleted
      const getResponse = await request(app)
        .get('/api/iata-codes');
      const deletedCode = getResponse.body.find(
        code => code._id === createResponse.body._id
      );
      expect(deletedCode).toBeUndefined();
    });

    it('should return 404 for non-existent IATA code', async () => {
      const nonExistentId = new ObjectId();
      const response = await request(app)
        .delete(`/api/iata-codes/${nonExistentId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('IATA code not found');
    });
  });
});