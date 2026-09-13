'use strict';

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Socket.IO Server Manager — real-time bidirectional communication.
 */
let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: config.clientUrl,
      credentials: true,
    },
  });

  // Socket Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: Missing token'));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.userId;
    const roomName = `user:${userId}`;

    socket.join(roomName);
    console.log(`🔌 [Socket.IO] User ${userId} connected & joined room '${roomName}'`);

    socket.on('disconnect', () => {
      console.log(`🔌 [Socket.IO] User ${userId} disconnected`);
    });
  });

  return io;
};

/**
 * Emit a real-time event to a specific user's private room.
 */
const emitToUser = (userId, event, payload) => {
  if (io) {
    const roomName = `user:${userId}`;
    io.to(roomName).emit(event, payload);
    console.log(`📡 [Socket.IO] Emitted event '${event}' to room '${roomName}'`);
  }
};

const getIO = () => io;

module.exports = {
  initSocket,
  emitToUser,
  getIO,
};
