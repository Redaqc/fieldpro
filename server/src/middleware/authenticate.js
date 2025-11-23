/**
 * JWT Authentication Middleware
 * Replaces Base44 Auth
 */

import jwt from 'jsonwebtoken';
import { unauthorized } from './errorHandler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const authenticate = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw unauthorized('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw unauthorized('Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw unauthorized('Invalid token');
    }
    throw error;
  }
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET);

      req.user = {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role
      };
    }
  } catch (error) {
    // Silently ignore auth errors for optional auth
  }

  next();
};

// Role-based authorization
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw unauthorized('Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw unauthorized(`Role ${req.user.role} not authorized`);
    }

    next();
  };
};

// Generate JWT token
export const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' } // Token expires in 7 days
  );
};
