const redis = require('../db_config/redis');
const crypto = require('crypto');

async function saveSessionCache(userId, token, exp) {
    const sessionId = crypto.randomUUID();
    const data = JSON.stringify({
        token,
        userId
    });
    await redis.rPush(sessionId, data);
    await redis.expire(sessionId, exp);
    return sessionId;
};

async function deleteSessionCache(req, reqType) {
    if (reqType === 'deleteUser') {
        const deletedSession = await redis.del(req.session);

        if (deletedSession === 0) {
            throw new Error('no authorization tokens associated with the user!');
        };
    }
    else {
        const deletedSession = await redis.LREM(req.session, 1, JSON.stringify({
            token: req.token,
            userId: req.user.userId
        }));

        if (deletedSession === 0) {
            throw new Error('authorization token does not exist!');
        };
    }
};

async function verifyCache(key, type) {
    const identifier = `${type}:${key}`;
    const cachedData = await redis.lRange(identifier, 0, -1);
    if (!cachedData || cachedData.length <= 0) {
        return false;
    };
    return JSON.parse(cachedData);
};

async function saveCacheData(key, type, data) {
    const identifier = `${type}:${key}`;
    const dataToSave = JSON.stringify(data);
    await redis.rPush(identifier, dataToSave);
    return true;
};

async function deleteCacheData(key, type) {
    const identifier = `${type}:${key}`;
    const deletedCache = await redis.del(identifier);
    if (deletedCache === 0) {
        console.log('no cache Data found');
    };
};

module.exports = { saveSessionCache, deleteSessionCache, verifyCache, saveCacheData, deleteCacheData };