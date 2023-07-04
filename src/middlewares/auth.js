const jwt = require('jsonwebtoken');
require('dotenv').config();
const redis = require('../db_config/redis');

async function ensureAuth(req) {
    const sessionId = req.cookies.authorization;

    if (!sessionId) {
        return { authenticated: false, decoded: null };
    };

    let sessionCache = await redis.lRange(sessionId, 0, -1);

    if (!sessionCache || sessionCache.length <= 0) {
        return { authenticated: false, decoded: null };
    };

    sessionCache = JSON.parse(sessionCache);

    const decoded = jwt.verify(sessionCache.token, process.env.JWT_SECRET);
    return { authenticated: true, decoded, sessionId, sessionCache};
};

const auth = async (req, res, next) => {
    try {
        const { authenticated, decoded, sessionId, sessionCache } = await ensureAuth(req);
        if (!authenticated) {
            throw new Error('unauthorized user');
        };

        req.user = decoded;
        req.session = sessionId;
        req.token = sessionCache.token;

        next();
    }
    catch (err) {
        console.log(err.message);
        res.redirect('/login');
        // res.status(500).json({
        //     status: 'error',
        //     description: 'an error occured'
        // });
    };
};

async function redirectIfLoggedIn(req, res, next) {
    try {
        const { authenticated } = await ensureAuth(req);

        if (authenticated) {
            return res.redirect('/');
        }

        return next();
    }
    catch (err) {
        console.log(err.message);
        next();
    }
};

module.exports = { auth, redirectIfLoggedIn };