const request = require('supertest');
const { io: Client } = require('socket.io-client');
const app = require('../app');

// Import the same hash function used in the API
const simpleHashPassword = (password) => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
};

describe('Admin API Tests', () => {
  let clientSocket;
  
  beforeAll(async () => {
    clientSocket = Client('http://localhost:3000');
    await new Promise(resolve => clientSocket.on('connect', resolve));
  });

  afterAll(async () => {
    clientSocket.close();
    await app.close();
  });

  describe('GET /api/admins', () => {
    it('should return admins array with sensitive data removed', async () => {
      const response = await request(app).get('/api/admins');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // Check that no admin has passwordHash field
      response.body.forEach(admin => {
        expect(admin.passwordHash).toBeUndefined();
      });
    });
  });

  describe('POST /api/admins', () => {
    it('should create a new admin', async () => {
      const newAdmin = {
        email: 'test@example.com',
        password: 'testPassword123'
      };

      const response = await request(app)
        .post('/api/admins')
        .send(newAdmin);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Admin created successfully');
      expect(response.body.adminId).toBeDefined();

      // Cleanup: Delete the created admin
      await request(app)
        .delete(`/api/admins/${response.body.adminId}`);
    });

    it('should return 400 if required fields are missing', async () => {
      const invalidAdmin = {
        email: 'test@example.com'
        // Missing password
      };

      const response = await request(app)
        .post('/api/admins')
        .send(invalidAdmin);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('All fields are required');
    });

    it('should return 409 if admin already exists', async () => {
      const admin = {
        email: 'existing@example.com',
        password: 'password123'
      };

      // First create the admin
      await request(app)
        .post('/api/admins')
        .send(admin);

      // Try to create the same admin again
      const response = await request(app)
        .post('/api/admins')
        .send(admin);

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Admin already exists');

      // Cleanup: Find and delete the test admin
      const allAdmins = await request(app).get('/api/admins');
      const testAdmin = allAdmins.body.find(a => a.email === admin.email);
      if (testAdmin) {
        await request(app).delete(`/api/admins/${testAdmin._id}`);
      }
    });
  });

  describe('POST /api/admin/login', () => {
    it('should login successfully with correct credentials', async () => {
      // First create a test admin
      const admin = {
        email: 'login@example.com',
        password: 'password123'
      };

      const createResponse = await request(app)
        .post('/api/admins')
        .send(admin);

      // Hash the password the same way as the API does
      const hashedPassword = simpleHashPassword(admin.password);

      // Attempt login with hashed password
      const loginResponse = await request(app)
        .post('/api/admin/login')
        .send({
          email: admin.email,
          passwordHash: hashedPassword
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.message).toBe('Admin login successful');
      expect(loginResponse.body.admin.email).toBe(admin.email);

      // Cleanup
      await request(app)
        .delete(`/api/admins/${createResponse.body.adminId}`);
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({
          email: 'nonexistent@example.com',
          passwordHash: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({
          email: 'test@example.com'
          // Missing passwordHash
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email and password are required');
    });
  });

  describe('DELETE /api/admins/:adminId', () => {
    it('should delete existing admin and emit socket event', async () => {
      // First create an admin to delete
      const newAdmin = {
        email: 'todelete@example.com',
        password: 'deleteMe123'
      };

      const createResponse = await request(app)
        .post('/api/admins')
        .send(newAdmin);

      const adminId = createResponse.body.adminId;

      const socketPromise = new Promise(resolve => {
        clientSocket.on('adminDeleted', (data) => {
          resolve(data);
        });
      });

      const deleteResponse = await request(app)
        .delete(`/api/admins/${adminId}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.message).toBe('Admin deleted successfully');
      expect(deleteResponse.body.deletedId).toBe(adminId);

      // Verify socket event
      const socketData = await socketPromise;
      expect(socketData.adminId).toBe(adminId);

      // Verify admin is deleted
      const getResponse = await request(app).get('/api/admins');
      const deletedAdmin = getResponse.body.find(a => a._id === adminId);
      expect(deletedAdmin).toBeUndefined();
    });

    it('should return 404 for non-existent admin', async () => {
      const response = await request(app)
        .delete('/api/admins/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Admin not found');
    });
  });
});