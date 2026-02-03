const redis = require('redis');

// Create Redis client
const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                console.error('❌ Redis: Too many retries, giving up');
                return new Error('Redis connection failed');
            }
            return retries * 100; // Reconnect after retries * 100ms
        }
    }
});

redisClient.on('error', (err) => {
    console.error('❌ Redis Client Error:', err);
});

redisClient.on('connect', () => {
    console.log('✅ Redis Client Connected');
});

redisClient.on('ready', () => {
    console.log('✅ Redis Client Ready');
});

// Connect to Redis
(async () => {
    try {
        await redisClient.connect();
    } catch (error) {
        console.error('❌ Redis connection failed:', error.message);
        console.warn('⚠️  Token revocation will not work without Redis. Running without Redis support.');
    }
})();

module.exports = redisClient;
