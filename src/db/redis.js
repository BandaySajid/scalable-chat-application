const redis = require('redis');

const redisUrl = 'redis://127.0.0.1:6379';

const redisClient = redis.createClient(redisUrl);

redisClient.on('error', (err) => {
    console.error('Redis client error', err.message);
});

(async function () {
    await redisClient.connect();
})();

module.exports = redisClient;
