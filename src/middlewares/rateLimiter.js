const rateLimit = require('express-rate-limit');

/**
 * Rate limiter untuk login endpoint
 * Max 5 attempts per 15 minutes
 */
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit 5 requests per windowMs
    message: {
        success: false,
        message: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.'
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    skipSuccessfulRequests: false, // Count successful requests
    skipFailedRequests: false, // Count failed requests
});

/**
 * Rate limiter untuk general API endpoints
 * Max 100 requests per 15 minutes
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit 100 requests per windowMs
    message: {
        success: false,
        message: 'Terlalu banyak request dari IP ini. Silakan coba lagi nanti.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Strict rate limiter untuk sensitive operations
 * Max 3 attempts per hour
 */
const strictLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: {
        success: false,
        message: 'Terlalu banyak percobaan. Silakan coba lagi dalam 1 jam.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    loginLimiter,
    apiLimiter,
    strictLimiter
};
