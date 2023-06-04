const express = require('express');
const router = express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const auth = require('../middleware/auth');
const validateUpdates = require('../utils/validateUpdates');
const { saveSessionCache, deleteSessionCache } = require('../utils/redisFunctions');

//signup
router.post('/signup', async (req, res) => {
    try {
        const user = await User.create(req.body);

        const newUser = {
            userId: user.userId,
            email: user.email,
            username: user.username
        };

        const token = jwt.sign(newUser, process.env.JWT_SECRET);

        //saving session cache to redis
        const sessionId = await saveSessionCache(newUser.userId, token, 400); // expiring after 400 seconds;


        res.cookie('authorization', sessionId, { signed: true });

        res.status(201).json({
            status: 'user signed up successfully',
            user: newUser
        });
    }
    catch (err) {
        console.log(err.message);
        const error = err.name === 'SequelizeUniqueConstraintError' ? err.errors[0].message : 'an error occured';
        res.status(400).json({
            status: 'error',
            description: error
        });
    };
});

//login
router.post('/login', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        let user;

        if (username) {
            user = await User.findOne({
                where: {
                    username
                }
            });
        }
        else if (email) {
            user = await User.findOne({
                where: {
                    email
                }
            });
        }

        if (!user) {
            throw new Error('user not found');
        }

        await user.compareHash(password);

        const newUser = {
            userId: user.userId,
            email: user.email,
            username: user.username
        };
        const token = jwt.sign(newUser, process.env.JWT_SECRET);

        //saving session cache to redis
        const sessionId = await saveSessionCache(newUser.userId, token, 400); // expiring after 400 seconds;

        console.log(sessionId)

        res.cookie('authorization', sessionId, { signed: true });

        res.status(201).json({
            status: 'user logged in successfully',
            user: newUser
        });
    }
    catch (err) {
        console.log(err.message);
        const error = err.name === 'SequelizeUniqueConstraintError' ? err.errors[0].message : 'an error occured';
        res.status(400).json({
            status: 'error',
            description: error
        });
    };
});

//Update
router.put('/updateUser', auth, async (req, res) => {
    try {
        const availableUpdates = ['username', 'email', 'password'];
        const updatesRequested = Object.keys(req.body);
        const isValidUpdate = validateUpdates(updatesRequested, availableUpdates);

        if (!isValidUpdate) {
            return res.status(404).json({
                status: 'error',
                description: 'invalid update requested'
            });
        };
        const updateDetails = {};

        updatesRequested.forEach((update) => {
            updateDetails[update] = req.body[update];
        });

        await User.update(updateDetails, {
            where: {
                userId: req.user.userId
            },
            individualHooks: true
        });

        res.status(200).json({
            status: 'success',
            description: 'user details updated',
        });
    }
    catch (err) {
        console.log(err.message);
        res.status(400).json({
            status: 'error',
            description: 'an error occured'
        });
    };
});

//Logout
router.get('/logout', auth, async (req, res) => {
    try {
        await deleteSessionCache(req, 'logout');
        res.status(200).json({
            status: 'success',
            description: 'user logged out'
        });
    }
    catch (err) {
        console.log(err.message);
        res.status(400).json({
            status: 'error',
            description: 'an error occured'
        });
    };
});

//Delete
router.delete('/deleteUser', auth, async (req, res) => {
    try {
        await deleteSessionCache(req, 'deleteUser');

        const deletedUser = await User.destroy({
            where: {
                userId: req.user.userId
            }
        });

        if (deletedUser === 0) {
            throw new Error('user does not exist!');
        };

        res.status(200).json({
            status: 'success',
            description: 'user deleted successfully'
        });
    }
    catch (err) {
        console.log(err.message);
        res.status(400).json({
            status: 'error',
            description: 'an error occured'
        });
    };
});

module.exports = router;