const redis = require('redis');
require('dotenv').config();

const redisClient = redis.createClient(process.env.REDIS_URL);

redisClient.on('error', (err) => {
    console.error('Redis client error', err.message);
});

(async function () {
    await redisClient.connect();
})();

module.exports = redisClient;
