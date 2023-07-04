const express = require('express');
const router = new express.Router();
const { auth } = require('../middlewares/auth');
const { getMessageRoom } = require('../models/room');

router.get('/chat', auth, async (req, res) => {
    try {
        let { messages, owner } = await getMessageRoom(req.cookies.currentRoom);
        messages.shift();

        messages = messages.map((obj) => {
            const msg = JSON.parse(obj);
            return {
                message: msg.message,
                isOpponent: req.cookies.username === msg.username ? false : true,
                username: msg.username,
                sentAt: msg.sentAt
            };
        });

        res.render('chat', {
            pageTitle: 'chat',
            admin: owner,
            messages: messages,
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

module.exports = router;