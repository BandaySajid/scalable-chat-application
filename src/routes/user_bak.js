const express = require('express');
const router = new express.Router();
const User = require('../models/user');
const { auth, redirectIfLoggedIn } = require('../middlewares/auth');


router.get('/', auth, async (req, res) => {
    try{
        await req.user.populate({
            path: 'ownedRooms',
        });
        
        const ownedRooms = req.user.ownedRooms.map((room) => {
            return room.roomId;
        });

        const joinedRooms = req.user.joinedRooms.map((room) => {
            return room.room;
        });
        res.render('index', {
            joinedRooms,
            ownedRooms
        });
    }
    catch(err){
        res.status(500).json({
            "error" : "an error occured"
        })
    }
});



//Signup
router.get('/signup', redirectIfLoggedIn, async (req, res) => {
    res.render('signup', {
        pageTitle: 'signup',
    });
});

router.post('/signup', async (req, res) => {
    const user = new User(req.body);
    try {
        const token = await user.generateAuthToken();
        res.cookie('token', token, {
            httpOnly: true,
            secure: true
        });

        const { username } = user;
        // Set the cookie
        res.cookie("username", username, {
            // httpOnly: true,//change it later to make it secure, as it will not be accessed using http
            sameSite: true,
            secure: true
        });

        res.status(201).json({
            status: "success",
            description: "user created successfully"
        });
    }
    catch (err) {
        let errMsg;
        if (err.message.includes('duplicate')) {
            errMsg = Object.keys(err.keyValue) + ` has already been taken`;
        }
        else {
            errMsg = err.errors[Object.keys(err.errors)[0]].properties.message;
        }
        return res.status(500).json({
            status: 'error',
            description: errMsg
        });
    }
});



//Login
router.get('/login', redirectIfLoggedIn, async (req, res) => {
    res.render('login', {
        pageTitle: 'login'
    });
});

router.post('/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.cookie('token', token, {
            httpOnly: true,
            secure: true
        });
        const { username } = user;
        // Set the cookie
        res.cookie("username", username, {
            // httpOnly: true,//change it later to make it secure, as it will not be accessed using http
            sameSite: true,
            secure: true 
        });

        return res.status(302).json({
            status: 'success',
            description: 'Logged in!'
        });


    }
    catch (err) {
        const errMsg = err.message;
        return res.status(500).json({
            status: 'error',
            description: errMsg
        });
    };
});


//Logout
router.get('/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((tokensObj) => {
            return tokensObj.token !== req.token;
        });
        res.clearCookie('token');
        res.clearCookie('username');
        await req.user.save();
        return res.redirect('/login')
    }
    catch (err) {
        const errMsg = err.message;
        return res.status(500).json({
            status: 'error',
            description: errMsg
        });
    }
});

router.get('/logoutFromAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        res.clearCookie('token');
        res.clearCookie('username');
        await req.user.save();
        return res.redirect('/login');
    }
    catch (err) {
        const errMsg = err.message;
        return res.status(500).json({
            status: 'error',
            description: errMsg
        });
    }
})

module.exports = router;