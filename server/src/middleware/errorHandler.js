/**
 * Global Error Handler Middleware
 * Centralized error handling for the API
 */

export class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err, req, res, next) => {
  let { statusCode = 500, message, details } = err;

  // Log error
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', {
      statusCode,
      message,
      details,
      stack: err.stack,
      url: req.url,
      method: req.method,
    });
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    details = err.details || err.message;
  }

  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Unauthorized';
  }

  if (err.code === '23505') { // PostgreSQL unique violation
    statusCode = 409;
    message = 'Duplicate entry';
  }

  // Send error response
  res.status(statusCode).json({
    error: {
      message,
      ...(details && { details }),
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    }
  });
};

// Helper functions
export const badRequest = (message, details) => new ApiError(400, message, details);
export const unauthorized = (message = 'Unauthorized') => new ApiError(401, message);
export const forbidden = (message = 'Forbidden') => new ApiError(403, message);
export const notFound = (message = 'Not found') => new ApiError(404, message);
export const conflict = (message, details) => new ApiError(409, message, details);
export const serverError = (message, details) => new ApiError(500, message, details);
