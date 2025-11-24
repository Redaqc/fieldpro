/**
 * Authentication Routes
 * Replaces Base44 Auth with JWT
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from '../database/config.js';
import { generateToken } from '../middleware/authenticate.js';
import { badRequest, unauthorized, notFound } from '../middleware/errorHandler.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(['admin', 'manager', 'dispatcher', 'technician']).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  // Validate request
  const validation = registerSchema.safeParse(req.body);
  if (!validation.success) {
    throw badRequest('Validation error', validation.error.errors);
  }

  const { email, password, name, role = 'technician' } = validation.data;

  // Check if user already exists
  const existingUser = await query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw badRequest('User with this email already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const result = await query(
    `INSERT INTO users (email, password_hash, name, role, created_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING id, email, name, role, created_at`,
    [email, hashedPassword, name, role]
  );

  const user = result.rows[0];

  // Generate JWT token
  const token = generateToken(user);

  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    token
  });
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', authRateLimiter, async (req, res) => {
  // Validate request
  const validation = loginSchema.safeParse(req.body);
  if (!validation.success) {
    throw badRequest('Validation error', validation.error.errors);
  }

  const { email, password } = validation.data;

  // Find user
  const result = await query(
    'SELECT id, email, password_hash, name, role FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw unauthorized('Invalid credentials');
  }

  const user = result.rows[0];

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    throw unauthorized('Invalid credentials');
  }

  // Update last login
  await query(
    'UPDATE users SET last_login = NOW() WHERE id = $1',
    [user.id]
  );

  // Generate JWT token
  const token = generateToken(user);

  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    token
  });
});

/**
 * GET /api/auth/me
 * Get current user (requires authentication)
 */
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw unauthorized('No token provided');
  }

  // This will be handled by authenticate middleware in production
  // For now, return a simple response
  res.json({
    message: 'User profile endpoint',
    note: 'Use authenticate middleware in routes'
  });
});

/**
 * POST /api/auth/logout
 * Logout user (client-side token deletion)
 */
router.post('/logout', (req, res) => {
  // With JWT, logout is handled client-side by deleting the token
  // Server can optionally blacklist tokens (requires Redis)
  res.json({
    message: 'Logout successful',
    note: 'Delete token from client storage'
  });
});

export default router;
