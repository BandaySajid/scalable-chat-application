const express = require('express');
const router = new express.Router();
const { auth } = require('../middlewares/auth');
const Message = require('../models/message');
const Room = require('../models/room');


router.get('/createRoom', auth, (req, res) => {
    res.render('createRoom', {
        pageTitle: 'create room'
    });
});

router.post('/createRoom', auth, async (req, res) => {
    const reqRoomId = req.body.roomId.toLowerCase()
    const room = new Room({
        roomId: reqRoomId,
        owner: req.user._id
    });
    try {
        const messageRoom = new Message({
            messages: [],
            roomId: reqRoomId
        });
        await room.saveUserToRoom(req.user.username);
        await messageRoom.save();
        req.user.joinedRooms = req.user.joinedRooms.concat({ room: reqRoomId });
        await req.user.save();
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
        let errMsg;
        if (err.message.includes('duplicate')) {
            errMsg = Object.keys(err.keyValue) + ` already exists`;
        }
        else {
            errMsg = err.message;
        }
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
        const room = await Room.findOne({ roomId: reqRoomId });
        if (!room) {
            throw new Error('room does not exist');
        }

        const alreadyExists = req.user.joinedRooms.find((roomId) => {
            return roomId.room === reqRoomId;
        });

        if (!alreadyExists) {
            req.user.joinedRooms = req.user.joinedRooms.concat({ room: reqRoomId });
            await room.saveUserToRoom(req.user.username);
            await req.user.save();
        }

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
        return res.status(500).json({
            status: 'error',
            description: err.message
        });
    }
});

router.post('/leaveRoom', auth, async (req, res) => {
    try {
        req.user.joinedRooms = req.user.joinedRooms.filter((room) => {
            return room.room !== req.body.room;
        });
        await req.user.save();
        return res.status(200).json({
            status: 'success',
            description: 'room has been successfully left'
        });
    }
    catch (err) {
        return res.status(500).json({
            status: 'error',
            description: err.message
        });
    }
});

router.get('/relatedRooms', auth, async (req, res) => {
    try {
        await req.user.populate({
            path: 'ownedRooms',
        });

        const ownedRooms = req.user.ownedRooms.map((room) => {
            return room.roomId;
        });

        const joinedRooms = req.user.joinedRooms.map((room) => {
            return room.room;
        });
        res.status(200).json({
            status: 'success',
            joinedRooms,
            ownedRooms
        });
    }
    catch (err) {
        return res.status(500).json({
            status: 'error',
            description: err.message
        });
    }
});

module.exports = router;

