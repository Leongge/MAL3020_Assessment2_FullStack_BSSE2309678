const request = require('supertest');
const { io: Client } = require('socket.io-client');
const app = require('../app'); 

describe('Users API Tests', () => {
    const testUser = {
        name: 'Cassey',
        email: 'cassey@example.com',
        passwordHash: 'hashedPassword123',
        phone: '1234567890',
        address: '123 Test St',
        identityNo: '000101020881'
      };
  let clientSocket;
  let testUserId;
  
  beforeAll(async () => {
    clientSocket = Client('http://localhost:3000');
    await new Promise(resolve => clientSocket.on('connect', resolve));
  });

  afterAll(async () => {
    clientSocket.close();
    await app.close(); 
  });

  afterEach(async () => {
    if (testUserId) {
        try {
            await request(app).delete(`/api/users/${testUserId}`);
        } catch (error) {
            console.log('Cleanup error:', error);
        }
        testUserId = null;
    }
});

  describe('GET /api/users', () => {
    it('should return users array without password hashes', async () => {
      const response = await request(app).get('/api/users');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // Verify no password hashes are returned
      const hasPasswordHash = response.body.some(user => user.passwordHash);
      expect(hasPasswordHash).toBe(false);
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const response = await request(app)
        .post('/api/users')
        .send(testUser);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User created successfully');
      expect(response.body.userId).toMatch(/^user\d+$/);
      testUserId = response.body.userId;

      const getResponse = await request(app).get('/api/users');
      const createdUser = getResponse.body.find(u => u._id === testUserId);
      expect(createdUser).toBeDefined();
    });

    it('should return 400 if required fields are missing', async () => {
      const incompleteUser = { name: 'Test User', email: 'test@example.com' };
      const response = await request(app)
        .post('/api/users')
        .send(incompleteUser);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('All fields are required');
    });

    it('should return 409 if user already exists', async () => {
      // First create a user
      const firstResponse = await request(app)
                .post('/api/users')
                .send(testUser);

      testUserId = firstResponse.body.userId;

      // Try to create the same user again
      const response = await request(app)
        .post('/api/users')
        .send(testUser);

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('User already exists');
    });
  });

  describe('POST /api/login', () => {
    beforeEach(async () => {
      // Create test user before each login test
      const response = await request(app)
      .post('/api/users')
      .send(testUser);
        testUserId = response.body.userId;
    });

    afterEach(async () => {
      // Cleanup: Delete test user after each test
      if (testUserId) {
        await request(app).delete(`/api/users/${testUserId}`);
        testUserId = null;
        }
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: testUser.email,
          passwordHash: testUser.passwordHash
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.name).toBe(testUser.name);
    });

    it('should return 401 with incorrect credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: testUser.email,
          passwordHash: 'wrongPassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should return 400 if email or password is missing', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: testUser.email
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email and password are required');
    });
  });

  describe('DELETE /api/users/:userId', () => {

    beforeEach(async () => {
      // Create test user and store ID
      const response = await request(app)
        .post('/api/users')
        .send(testUser);
        testUserId = response.body.userId;

        // Verify user was created
        const getResponse = await request(app).get('/api/users');
        const createdUser = getResponse.body.find(u => u._id === testUserId);
        expect(createdUser).toBeDefined();
    });

    it('should delete existing user and emit socket event', async () => {
      const socketPromise = new Promise(resolve => {
        clientSocket.on('userDeleted', (data) => {
          resolve(data);
        });
      });

      const response = await request(app)
        .delete(`/api/users/${testUserId}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User deleted successfully');
      expect(response.body.userId).toBe(testUserId);

      // Verify socket event
      const socketData = await socketPromise;
      expect(socketData.userId).toBe(testUserId);

      // Verify user is actually deleted
      const getResponse = await request(app).get('/api/users');
      const deletedUser = getResponse.body.find(u => u._id === testUserId);
      expect(deletedUser).toBeUndefined();
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .delete('/api/users/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });
  });
});