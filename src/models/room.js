const redis = require('../db_config/redis');
const { EventEmitter } = require('node:events');
const expireTime = 43200;

class newEventEmitter extends EventEmitter { };

const roomEvent = new newEventEmitter();

async function createRoom({ userId, username, roomId }) {
    const identifier = `${userId}:ownedRooms`;
    const roomExists = await redis.EXISTS(identifier);
    if (roomExists === 1) {
        throw new Error('room already exists');
    }
    await redis.rPush(identifier, roomId);
    await redis.expire(identifier, expireTime);
    await redis.HSET(`room:${roomId}`, 'owner', username);
    await redis.rPush(`room:${roomId}:members`, username);


    await redis.lPush(`room:${roomId}:messages`, JSON.stringify({
        msg : 'testmsg'
    }));

    // await redis.HSET(`room:${roomId}`, 'members', 0);
    await saveUserToRoom({ userId, username, roomId, owner: true });
    await redis.expire(`room:${roomId}`, expireTime);
    roomEvent.emit('create', roomId);
};

async function createJoinedRoom(userId, roomId) {
    const identifier = `${userId}:joinedRooms`;
    await redis.rPush(identifier, roomId);
    await redis.expire(identifier, expireTime);
};

async function getUserRooms(userId, type) {
    const identifier = `${userId}:${type}Rooms`;
    const rooms = await redis.lRange(identifier, 0, -1);
    return rooms;
};

async function saveUserToRoom({ userId, username, roomId, owner = false }) {
    const joinedRooms = await getUserRooms(userId, 'joined');

    const alreadyJoined = joinedRooms.some((room) => {
        return room === roomId;
    });

    if (alreadyJoined) {
        throw new Error('room already joined');
    };

    if (owner) {
        createJoinedRoom(userId, roomId);
        return;
    }

    const identifier = `room:${roomId}:members`;
    const roomExists = await redis.EXISTS(identifier);
    if (!(roomExists === 1)) {
        throw new Error('room does not exist');
    };

    await redis.rPush(identifier, username);

    createJoinedRoom(userId, roomId);
};

async function getRoomMembers(roomId) {
    const identifier = `room:${roomId}:members`;
    const roomExists = await redis.EXISTS(`room:${roomId}:members`);
    if (!(roomExists === 1)) {
        throw new Error('room does not exist');
    }
    const owner = await redis.HGET(`room:${roomId}`, 'owner');
    const members = await redis.lRange(identifier, 0, -1);
    return {
        membersCount: members.length, members, owner
    };
};

async function leaveRoom(userId, roomId, username) {
    const membersIdentifier = `room:${roomId}:members`;
    const joinedRoomIdentifier = `${userId}:joinedRooms`;
    const removedMembers = await redis.LREM(membersIdentifier, 1, username);
    if (removedMembers < 1) {
        throw new Error('error occured, cannot leave room!');
    }
    const removedRooms = await redis.LREM(joinedRoomIdentifier, 1, roomId);
    if (removedMembers < 1 || removedRooms < 1) {
        throw new Error('an error occured');
    }
};

async function deleteRoom(userId, roomId) {
    const membersIdentifier = `room:${roomId}:members`;
    const joinedRoomIdentifier = `${userId}:joinedRooms`;
    const ownedRoomIdentifier = `${userId}:ownedRooms`;
    const msgRoomIdentifier = `room:${roomId}:messages`;
    const removedRooms = await redis.DEL(membersIdentifier);
    const messageRoom = await redis.DEL(msgRoomIdentifier);

    if (removedRooms < 1) {
        throw new Error('error occured, cannot delete room!');
    }

    if (messageRoom < 1) {
        throw new Error('error occured, cannot delete message room!');
    }

    const removedJoinedRooms = await redis.lRem(joinedRoomIdentifier, 1, roomId);
    const removedOwnedRooms = await redis.lRem(ownedRoomIdentifier, 1, roomId);


    if (removedJoinedRooms < 1 || removedOwnedRooms < 1) {
        throw new Error('error occured, remove room!');
    }

    roomEvent.emit('delete', roomId);
};

async function roomUserAuthenticated(room, username) {
    const identifier = `room:${room}:members`;
    const members = await redis.lRange(identifier, 0, -1);

    const exists = members.some((member) => {
        return member === username;
    });

    if (exists) {
        return true;
    }
    return false;
};

async function saveMessage(roomId, message) {
    const identifier = `room:${roomId}:messages`;
    const roomExists = await redis.EXISTS(identifier);
    if (!roomExists) {
        throw new Error('message room does not exist');
    }

    await redis.rPush(identifier, message);
    await redis.expire(identifier, expireTime);
};

async function getMessageRoom(roomId) {
    const identifier = `room:${roomId}`;
    const roomExists = await redis.EXISTS(identifier);

    if (!roomExists) {
        throw new Error('room does not exist');
    };

    const owner = await redis.HGET(identifier, 'owner');
    const messages = await redis.lRange(identifier + ':messages', 0, -1);

    return { owner, messages };
}

module.exports = { createRoom, getUserRooms, saveUserToRoom, getRoomMembers, leaveRoom, roomUserAuthenticated, deleteRoom, roomEvent, saveMessage, getMessageRoom };