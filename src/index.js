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
const Room = require('./models/room');
require('./db/mongoose');
require('dotenv').config();

const app = express();
app.set('view engine', 'ejs');
app.use(express.static(publicPath));
app.set('views', viewsPath);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors({
    origin: '*'
}));
app.use(userRouter);
app.use(roomRouter);
app.use(chatRouter);

const httpServer = app.listen(PORT, () => {
    console.log("Server is up on http://127.0.0.1:" + PORT);
});

const wsS = new WebSocketServer({
    server: httpServer
});

const rooms = {

}

//Socket Handling
wsS.on('connection', (socket, req) => {
    const cookies = req.headers.cookie.split('; ');
    const usernameCookie = cookies[1].split('=')[1];
    const currentRoom = cookies[2].split('=')[1];

    if (!rooms[currentRoom]) {
        Object.assign(rooms, { [currentRoom]: { clients: [] } });
    }

    rooms[currentRoom].clients = rooms[currentRoom].clients.concat({
        username: usernameCookie,
        socket
    });

    rooms[currentRoom].clients.forEach((client) => {
        if(client.socket !== socket){
            client.socket.send(JSON.stringify({
                status : 'join',
                message : `${usernameCookie} has joined the room`
            }));
        }
    });

    console.log('a client connected to websockets');
    socket.on('message', (message) => {
        const parsedMsg = JSON.parse(message.toString());
        rooms[currentRoom].clients.forEach((client) => {
            client.socket.send(JSON.stringify(parsedMsg));
        })
    });

    socket.on('close', () => {
        rooms[currentRoom].clients.forEach((client) => {
            if(client.socket !== socket){
                client.socket.send(JSON.stringify({
                    status : 'left',
                    message : `${usernameCookie} has left the room`
                }));
            }
        });

        rooms[currentRoom].clients = rooms[currentRoom].clients.filter((client) => {
            return client.socket !== socket;
        });

        console.log('client has left');
    });
});