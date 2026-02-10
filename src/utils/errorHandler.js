/**
 * Error Response Handler
 * Sanitizes error messages for production to prevent information leakage
 */

const sendErrorResponse = (res, statusCode, message, error = null) => {
  const response = {
    success: false,
    message
  };

  // Only include detailed error in development mode
  if (process.env.NODE_ENV === 'development' && error) {
    response.error = error.message;
    response.stack = error.stack;
  }

  // Log error for monitoring (in production, send to logging service)
  if (error) {
    console.error(`[ERROR] ${message}:`, error);
  }

  return res.status(statusCode).json(response);
};

/**
 * Constant time delay to prevent timing attacks
 * Used to equalize response times between different execution paths
 */
const constantTimeDelay = (ms = 100) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

module.exports = {
  sendErrorResponse,
  constantTimeDelay
};
