const express = require('express');
const router = new express.Router();
const { auth } = require('../middlewares/auth');
const { getMessageRoom, getRoomMembers } = require('../models/room');

router.get('/chat', auth, async (req, res) => {
    try {
        console.log('here')
        let { messages, owner } = await getMessageRoom(req.cookies.currentRoom);

        messages = messages.map((obj) => {
            const msg = JSON.parse(obj);
            if (msg.msg) {
                return false;
            }
            return {
                message: msg.message,
                isOpponent: req.cookies.username === msg.message.username ? false : true
            };
        });

        const roomUsers = await getRoomMembers(req.cookies.currentRoom);

        res.render('chat', {
            pageTitle: 'chat',
            admin: owner,
            roomUsers: roomUsers.members,
            messages : messages[0] === false ? [] : messages,
            roomId: req.cookies.currentRoom
        });
    }
    catch (err) {
        console.log(err);
        res.status(404).send({
            status: 'error',
            description: err.message
        });
    }
});

// router.post('/chat/saveMessage', auth, async (req, res) => {
//     try {
//         const messageRoom = await Message.findOne({ roomId : req.body.room });
//         if (!messageRoom) {
//             throw new Error('Message room does not exist');
//         }

//         await messageRoom.saveMessageToRoom(req.body);
//         res.status(201).json({
//             status: 'message added',
//             description: 'successfully saved to db'
//         });
//     }
//     catch (err) {
//         res.status(500).json({
//             status: 'error',
//             description: err.message
//         });
//     }
// });

module.exports = router;