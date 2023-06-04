const jwt = require('jsonwebtoken');
require('dotenv').config();
const redis = require('../db_config/redis');

const auth = async (req, res, next) => {
    try {
        const sessionId = req.cookies.authorization;

        if (!sessionId) {
            throw new Error('unauthorized user');
        };

        let sessionCache = await redis.lRange(sessionId, 0, -1);

        if (!sessionCache || sessionCache.length <= 0) {
            throw new Error('unauthorized user');
        };

        sessionCache = JSON.parse(sessionCache);

        const decoded = jwt.verify(sessionCache.token, process.env.JWT_SECRET);

        req.user = decoded;
        req.session = sessionId;
        req.token = sessionCache.token;

        next();
    }
    catch (err) {
        res.status(401).json({
            status: 'error',
            description: err.message
        });
    };
};

module.exports = auth;