/**
 * Entity CRUD End-to-End Tests
 * Tests for entity operations (Create, Read, Update, Delete)
 */

const request = require('supertest');
const app = require('../src/index');
const { query } = require('../src/database/config');

describe('Entity CRUD E2E Tests', () => {
  let authToken;
  let testCustomerId;
  let testJobId;

  // Setup: Create test user and login
  beforeAll(async () => {
    // Clean up test data
    await query('DELETE FROM users WHERE email = $1', ['entitytest@example.com']);

    // Register and login
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Entity Test User',
        email: 'entitytest@example.com',
        password: 'password123',
        role: 'admin',
      });

    authToken = registerRes.body.token;
  });

  afterAll(async () => {
    // Clean up test data
    if (testJobId) {
      await query('DELETE FROM jobs WHERE id = $1', [testJobId]);
    }
    if (testCustomerId) {
      await query('DELETE FROM customers WHERE id = $1', [testCustomerId]);
    }
    await query('DELETE FROM users WHERE email = $1', ['entitytest@example.com']);
  });

  describe('Customer Entity', () => {
    it('should create a new customer', async () => {
      const response = await request(app)
        .post('/api/entities/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Company Inc',
          email: 'contact@testcompany.com',
          phone: '555-1234',
          address: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zip: '12345',
          country: 'USA',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Company Inc');
      expect(response.body.email).toBe('contact@testcompany.com');

      testCustomerId = response.body.id;
    });

    it('should get customer by ID', async () => {
      const response = await request(app)
        .get(`/api/entities/customers/${testCustomerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(testCustomerId);
      expect(response.body.name).toBe('Test Company Inc');
    });

    it('should update customer', async () => {
      const response = await request(app)
        .put(`/api/entities/customers/${testCustomerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Company Name',
          phone: '555-5678',
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Company Name');
      expect(response.body.phone).toBe('555-5678');
    });

    it('should list customers', async () => {
      const response = await request(app)
        .get('/api/entities/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should search customers', async () => {
      const response = await request(app)
        .get('/api/entities/customers?search=Updated')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      const found = response.body.find(c => c.id === testCustomerId);
      expect(found).toBeDefined();
    });
  });

  describe('Job Entity', () => {
    it('should create a new job', async () => {
      const response = await request(app)
        .post('/api/entities/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customer_id: testCustomerId,
          title: 'Test Repair Job',
          description: 'Fix the broken widget',
          status: 'pending',
          priority: 'high',
          scheduled_start: new Date().toISOString(),
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test Repair Job');
      expect(response.body.customer_id).toBe(testCustomerId);
      expect(response.body.status).toBe('pending');

      testJobId = response.body.id;
    });

    it('should update job status', async () => {
      const response = await request(app)
        .put(`/api/entities/jobs/${testJobId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'in_progress',
        })
        .expect(200);

      expect(response.body.status).toBe('in_progress');
    });

    it('should get job with customer details', async () => {
      const response = await request(app)
        .get(`/api/entities/jobs/${testJobId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(testJobId);
      expect(response.body.title).toBe('Test Repair Job');
    });

    it('should filter jobs by status', async () => {
      const response = await request(app)
        .get('/api/entities/jobs?status=in_progress')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      const found = response.body.find(j => j.id === testJobId);
      expect(found).toBeDefined();
    });

    it('should delete job', async () => {
      await request(app)
        .delete(`/api/entities/jobs/${testJobId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify deletion
      await request(app)
        .get(`/api/entities/jobs/${testJobId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      testJobId = null; // Mark as deleted
    });
  });

  describe('Authorization checks', () => {
    it('should reject entity operations without token', async () => {
      await request(app)
        .get('/api/entities/customers')
        .expect(401);

      await request(app)
        .post('/api/entities/customers')
        .send({ name: 'Unauthorized Customer' })
        .expect(401);
    });

    it('should reject entity operations with invalid token', async () => {
      await request(app)
        .get('/api/entities/customers')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);
    });
  });

  describe('Validation checks', () => {
    it('should reject customer creation with missing required fields', async () => {
      await request(app)
        .post('/api/entities/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'incomplete@example.com',
          // Missing required 'name' field
        })
        .expect(400);
    });

    it('should reject job creation with invalid customer_id', async () => {
      await request(app)
        .post('/api/entities/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customer_id: 99999, // Non-existent customer
          title: 'Invalid Job',
          status: 'pending',
        })
        .expect(400);
    });
  });
});
