const express = require('express');
const router = new express.Router();
const { auth } = require('../middlewares/auth');
const Message = require('../models/message');
const Room = require('../models/room');
const User = require('../models/user');

router.get('/chat', auth, async (req, res) => {
    try {
        const room = await Room.findOne({ roomId: req.cookies.currentRoom });
        if (!room) {
            throw new Error('room does not exist')
        }
        const owner = await User.findOne({ _id: room.owner });
        if (!owner) {
            throw new Error('an error occured');
        }

        const messageRoom = await Message.findOne({roomId: req.cookies.currentRoom});
        if(!messageRoom){
            throw new Error('room not found');
        }

        const messages = messageRoom.messages.map((obj)=>{
            return {
                ...obj.message,
                isOpponent : req.cookies.username === obj.message.username ? false : true
            };
        })

        const roomUsers = room.roomUsers.map((user) => {
            return user.user;
        });
        res.render('chat', {
            pageTitle: 'chat',
            admin: owner.username,
            roomUsers,
            messages,
            roomId : req.cookies.currentRoom
        });
    }
    catch (err) {
        res.status(404).send({
            status: 'error',
            description: err.message
        });
    }
});

router.post('/chat/saveMessage', auth, async (req, res) => {
    try {
        const messageRoom = await Message.findOne({ roomId : req.body.room });
        if (!messageRoom) {
            throw new Error('Message room does not exist');
        }

        await messageRoom.saveMessageToRoom(req.body);
        res.status(201).json({
            status: 'message added',
            description: 'successfully saved to db'
        });
    }
    catch (err) {
        res.status(500).json({
            status: 'error',
            description: err.message
        });
    }
});

module.exports = router;