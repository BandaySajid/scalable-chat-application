const express = require('express');
const router = express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { auth, redirectIfLoggedIn } = require('../middlewares/auth');
const validateUpdates = require('../utils/validateUpdates');
const { saveSession, deleteSession } = require('../utils/redisFunctions');
const { getUserRooms } = require('../models/room');

router.get('/', auth, async (req, res) => {
    try {
        const joinedRooms = await getUserRooms(req.user.userId, 'joined');
        const ownedRooms = await getUserRooms(req.user.userId, 'owned');
        res.render('index', {
            joinedRooms,
            ownedRooms
        });
    }
    catch (err) {
        res.status(500).json({
            "error": "an error occured"
        })
    }
});


//signup
router.get('/signup', redirectIfLoggedIn, async (req, res) => {
    res.render('signup', {
        pageTitle: 'signup',
    });
});

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
        const sessionId = await saveSession(newUser.userId, token, 43200); // expiring after 5 days;


        res.cookie('authorization', sessionId, { sameSite: true, secure: true });
        res.cookie('username', newUser.username, {
            httpOnly: true,
            secure: true,
            sameSite: 'none', // Adjusted for cross-site compatibility
        })

        res.status(302).json({
            status: 'success',
            description: 'user signed up successfully',
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
router.get('/login', redirectIfLoggedIn, async (req, res) => {
    res.render('login', {
        pageTitle: 'login'
    });
});

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
            return res.status(404).json({
                status: 'error',
                description: 'user does not exist'
            });
        }

        await user.compareHash(password);

        const newUser = {
            userId: user.userId,
            email: user.email,
            username: user.username
        };
        const token = jwt.sign(newUser, process.env.JWT_SECRET);

        //saving session cache to redis
        const sessionId = await saveSession(newUser.userId, token, 43200); // expiring after 5 days;

        console.log(sessionId)

        res.cookie('authorization', sessionId, {
            httpOnly: true,
            secure: true,
            sameSite: 'none', // Adjusted for cross-site compatibility
        });
        res.cookie('username', newUser.username, {
            httpOnly: true,
            secure: true,
            sameSite: 'none', // Adjusted for cross-site compatibility
        });


        res.status(302).json({
            status: 'success',
            description: 'user logged in successfully',
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
        await deleteSession(req, 'logout');
        res.clearCookie('authorization');
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

router.get('/logoutFromAll', auth, async (req, res) => {
    try {
        await deleteSession(req, 'logoutFromAll');
        res.clearCookie('authorization');
        return res.redirect('/login');
    }
    catch (err) {
        const errMsg = err.message;
        return res.status(500).json({
            status: 'error',
            description: errMsg
        });
    }
});

//Delete
router.delete('/deleteUser', auth, async (req, res) => {
    try {
        await deleteSession(req, 'deleteUser');
        res.clearCookie('authorization');
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