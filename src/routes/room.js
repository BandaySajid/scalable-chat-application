const express = require('express');
const router = new express.Router();
const { auth } = require('../middlewares/auth');
const { createRoom, getUserRooms, saveUserToRoom, getRoomMembers, leaveRoom } = require('../models/room');


router.get('/createRoom', auth, (req, res) => {
    res.render('createRoom', {
        pageTitle: 'create room'
    });
});

router.post('/createRoom', auth, async (req, res) => {
    const reqRoomId = req.body.roomId.toLowerCase();
    try {
        await createRoom({
            userId: req.user.userId,
            username: req.user.username,
            roomId: reqRoomId
        });

        res.cookie("currentRoom", reqRoomId, {
            // httpOnly: true,//change it later to make it secure, as it will not be accessed using http
            maxAge: 3600000,
            sameSite: true,
            secure: true
        });
        return res.status(201).json({
            status: 'success',
            description: 'room has been created'
        });
    }
    catch (err) {
        console.log(err);
        let errMsg = err.message.includes('exists') ? err.message : 'an error occured';
        return res.status(500).json({
            status: 'error',
            description: errMsg
        });
    }
});


router.get('/joinRoom', auth, (req, res) => {
    res.render('joinRoom', {
        pageTitle: 'join room'
    });
});

router.post('/joinRoom', auth, async (req, res) => {
    try {
        const reqRoomId = req.body.roomId.toLowerCase()
        await saveUserToRoom({ userId: req.user.userId, username: req.user.username, roomId: reqRoomId, owner: false });

        res.cookie("currentRoom", reqRoomId, {
            maxAge: 3600000,
            // httpOnly: true,//change it later to make it secure, as it will not be accessed using http
            sameSite: true,
            secure: true
        });

        res.status(200).json({
            status: 'success',
            description: 'room joined successfully'
        });
    }
    catch (err) {
        console.log(err.message);
        return res.status(500).json({
            status: 'error',
            description: err.message
        });
    }
});

router.post('/leaveRoom', auth, async (req, res) => {
    try {
        await leaveRoom(req.user.userId, req.body.roomId, req.user.username);
        return res.status(200).json({
            status: 'success',
            description: 'room left successfully'
        });
    }
    catch (err) {
        console.log(err.message);
        return res.status(500).json({
            status: 'error',
            description: err.message
        });
    }
});

router.get('/userRooms', auth, async (req, res) => {
    try {
        const joinedRooms = await getUserRooms(req.user.userId, 'joined');

        const ownedRooms = await getUserRooms(req.user.userId, 'owned');

        res.status(200).json({
            status: 'success',
            joinedRooms,
            ownedRooms
        });
    }
    catch (err) {
        console.log(err.message);
        return res.status(500).json({
            status: 'error',
            description: err.message
        });
    }
});

module.exports = router;

