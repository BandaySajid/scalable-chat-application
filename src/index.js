const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 9090;
const { WebSocketServer } = require('ws');
const publicPath = path.join(__dirname, '../public/');
const viewsPath = path.join(__dirname, '../views/');
const userRouter = require('./routes/user');
const roomRouter = require('./routes/room');
const chatRouter = require('./routes/chat');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { ensureAuth } = require('./middlewares/auth');
const { roomUserAuthenticated } = require('./models/room');
const { roomEvent, saveMessage } = require('./models/room');
const redis = require('./db_config/redis');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.set('view engine', 'ejs');
app.use(express.static(publicPath));
app.set('views', viewsPath);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser('cookieSecret'));
app.use(cors({
    origin: '*'
}));
app.use(userRouter);
app.use(roomRouter);
app.use(chatRouter);

const httpServer = app.listen(PORT, () => {
    console.log("Server is up on http://127.0.0.1:" + PORT);
});

//redis-subscriber connection
const subscriber = redis.duplicate();
subscriber.on('error', (err) => {
    console.log('error with redis subscriber : ' + err.message);
});

const wsS = new WebSocketServer({
    server: httpServer
});

// httpServer.on('upgrade', async (request, socket, head) => {

//     try {
//         // cookieParser()(req, async () => {
//         //     const { authenticated } = await ensureAuth(req);
//         //     if (!authenticated) {
//         //         socket.destroy();
//         //     }
//         // });

//         wsS.handleUpgrade(request, socket, head, function done(ws) {
//             wsS.emit('connection', ws, request);
//         });
//     } catch (e) {
//         console.log(e.message);
//     }
// })

wsS.on('listening', async () => {
    //connection new subscriber
    await subscriber.connect();
});

//redis listener

const rooms = {

};

//pub-sub
const listener = async (message, channel) => {
    const socketId = JSON.parse(message).socketId;
    if (message.socketId) {
        delete message.socketId;
    }
    if (JSON.parse(message).status === 'join') {
        rooms[channel].clients.forEach((client) => {
            if (client.socket._uid !== socketId) {
                client.socket.send(message);
            }
        });
    }
    else if (JSON.parse(message).status === 'left') {
        rooms[channel].clients.forEach((client) => {
            if (client.socket._uid !== socketId) {
                client.socket.send(message);
            }
        });
    }
    else {
        rooms[channel].clients.forEach((client) => {
            client.socket.send(message);
        });
        await saveMessage(channel, message);
    }
};

roomEvent.on('create', async function (roomId) {
    console.log('room created');
    subscriber.subscribe(roomId, listener);
});

roomEvent.on('delete', async function (roomId) {
    subscriber.unsubscribe(roomId, listener);
});


//Socket Handling
wsS.on('connection', async (socket, req) => {
    socket._uid = crypto.randomUUID();
    let usernameCookie, currentRoom;
    try {
        const cookies = req.headers.cookie.split('; ');
        cookies.map((cookie, i) => {
            if (cookie.includes('username')) {
                usernameCookie = cookie.split('=')[1];
            }
            if (cookie.includes('currentRoom')) {
                currentRoom = cookie.split('=')[1];
            }
        })
    }
    catch (err) {
        console.log(err);
    };

    const isRoomUserAuthenticated = await roomUserAuthenticated(currentRoom, usernameCookie);

    if (!isRoomUserAuthenticated) {
        console.log('not authenticated room');
        socket.close(1000, 'unauthorized room user, user not a part of this room');
    }

    if (!rooms[currentRoom]) {
        Object.assign(rooms, { [currentRoom]: { clients: [] } });
    }

    rooms[currentRoom].clients = rooms[currentRoom].clients.concat({
        username: usernameCookie,
        socket
    });

    await redis.publish(currentRoom, JSON.stringify({
        status: 'join',
        message: `${usernameCookie} has joined the room`,
        socketId: socket._uid
    }));

    console.log('a client connected to websockets');
    socket.on('message', async (message) => {
        await redis.publish(currentRoom, JSON.stringify(JSON.parse(message.toString('utf-8'))));
    });

    socket.on('close', async (code) => {
        console.log(code);
        if (code === 1000) {
            return
        }
        await redis.publish(currentRoom, JSON.stringify({
            status: 'left',
            message: `${usernameCookie} has left the room`,
            socketId: socket._uid
        }));

        rooms[currentRoom].clients = rooms[currentRoom].clients.filter((client) => {
            return client.socket !== socket;
        });

        console.log('client has left');
    });
});