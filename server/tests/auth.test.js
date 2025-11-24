/**
 * Authentication End-to-End Tests
 * Tests for login, register, logout, and token validation
 */

const request = require('supertest');
const app = require('../src/index');
const { query } = require('../src/database/config');

describe('Authentication E2E Tests', () => {
  let authToken;
  let testUser;

  // Clean up test users before and after tests
  beforeAll(async () => {
    await query('DELETE FROM users WHERE email LIKE $1', ['test%@example.com']);
  });

  afterAll(async () => {
    await query('DELETE FROM users WHERE email LIKE $1', ['test%@example.com']);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'technician',
        })
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.name).toBe('Test User');
      expect(response.body.user.role).toBe('technician');

      testUser = response.body.user;
      authToken = response.body.token;
    });

    it('should reject duplicate email registration', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate User',
          email: 'test@example.com',
          password: 'password456',
          role: 'manager',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject registration with missing fields', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'incomplete@example.com',
          password: 'password123',
          // Missing name and role
        })
        .expect(400);
    });

    it('should reject weak passwords', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Weak Password User',
          email: 'weak@example.com',
          password: '123',
          role: 'technician',
        })
        .expect(400);

      expect(response.body.error).toMatch(/password/i);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject login with missing fields', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          // Missing password
        })
        .expect(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.email).toBe('test@example.com');
      expect(response.body).toHaveProperty('id');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should reject request without token', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });

    it('should reject request with invalid token', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token_here')
        .expect(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should allow logout even without token', async () => {
      await request(app)
        .post('/api/auth/logout')
        .expect(200);
    });
  });

  describe('Role-based access', () => {
    let adminToken, techToken;

    beforeAll(async () => {
      // Create admin user
      const adminRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Admin User',
          email: 'testadmin@example.com',
          password: 'admin123',
          role: 'admin',
        });
      adminToken = adminRes.body.token;

      // Create technician user
      const techRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Tech User',
          email: 'testtech@example.com',
          password: 'tech123',
          role: 'technician',
        });
      techToken = techRes.body.token;
    });

    it('should return correct role for admin', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.role).toBe('admin');
    });

    it('should return correct role for technician', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${techToken}`)
        .expect(200);

      expect(response.body.role).toBe('technician');
    });
  });
});
