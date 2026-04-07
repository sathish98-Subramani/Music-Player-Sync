// utils/socketHandler.js — Real-time room synchronization via Socket.IO

const Room = require('../models/Room');
const Message = require('../models/Message');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Track active users per room: { roomCode: [{ socketId, userId, username, avatar }] }
const roomUsers = {};

module.exports = (io) => {

  // ─── Auth middleware for Socket.IO ──────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('username avatar _id');
      if (!user) return next(new Error('User not found'));

      socket.user = user; // attach user to socket
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.user.username} (${socket.id})`);

    // ─── Join Room ─────────────────────────────────────────────
    socket.on('join-room', async ({ roomCode }) => {
      try {
        const room = await Room.findOne({ code: roomCode, isActive: true })
          .populate('currentSong')
          .populate('host', 'username');

        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Join Socket.IO room
        socket.join(roomCode);
        socket.currentRoom = roomCode;

        // Track user in room
        if (!roomUsers[roomCode]) roomUsers[roomCode] = [];

        // Remove any previous socket for same user
        roomUsers[roomCode] = roomUsers[roomCode].filter(u => u.userId !== socket.user._id.toString());

        roomUsers[roomCode].push({
          socketId: socket.id,
          userId: socket.user._id.toString(),
          username: socket.user.username,
          avatar: socket.user.avatar,
        });

        // Emit current room state to the joining user
        socket.emit('room-state', {
          currentSong: room.currentSong,
          currentTime: room.currentTime,
          isPlaying: room.isPlaying,
          queue: room.queue,
          host: room.host,
          users: roomUsers[roomCode],
        });

        // Notify others in room
        socket.to(roomCode).emit('user-joined', {
          user: { userId: socket.user._id, username: socket.user.username, avatar: socket.user.avatar },
          users: roomUsers[roomCode],
        });

        console.log(`👥 ${socket.user.username} joined room ${roomCode}`);
      } catch (err) {
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // ─── Leave Room ────────────────────────────────────────────
    socket.on('leave-room', ({ roomCode }) => {
      handleLeaveRoom(socket, roomCode);
    });

    // ─── Host: Play / Pause ────────────────────────────────────
    socket.on('playback-control', async ({ roomCode, action, currentTime, song }) => {
      try {
        const room = await Room.findOne({ code: roomCode });
        if (!room) return;

        // Only host can control playback
        if (room.host.toString() !== socket.user._id.toString()) {
          socket.emit('error', { message: 'Only the host can control playback' });
          return;
        }

        if (action === 'play') {
          room.isPlaying = true;
          room.currentTime = currentTime || 0;
          if (song) room.currentSong = song;
        } else if (action === 'pause') {
          room.isPlaying = false;
          room.currentTime = currentTime;
        } else if (action === 'seek') {
          room.currentTime = currentTime;
        } else if (action === 'change-song') {
          room.currentSong = song;
          room.currentTime = 0;
          room.isPlaying = true;
        }

        await room.save();

        // Broadcast to all in room (including sender)
        io.to(roomCode).emit('playback-update', {
          action,
          currentTime: room.currentTime,
          isPlaying: room.isPlaying,
          song: song || null,
        });
      } catch (err) {
        socket.emit('error', { message: 'Playback control failed' });
      }
    });

    // ─── Chat Message ──────────────────────────────────────────
    socket.on('send-message', async ({ roomCode, text }) => {
      try {
        if (!text || text.trim().length === 0) return;
        if (text.length > 500) return;

        const room = await Room.findOne({ code: roomCode });
        if (!room) return;

        // Save message to DB
        const message = await Message.create({
          room: room._id,
          sender: socket.user._id,
          text: text.trim(),
        });

        const populated = await message.populate('sender', 'username avatar');

        // Broadcast message to everyone in room
        io.to(roomCode).emit('new-message', {
          _id: populated._id,
          sender: { _id: socket.user._id, username: socket.user.username, avatar: socket.user.avatar },
          text: populated.text,
          createdAt: populated.createdAt,
        });
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ─── Add to Queue ──────────────────────────────────────────
    socket.on('add-to-queue', async ({ roomCode, songId }) => {
      try {
        const room = await Room.findOne({ code: roomCode });
        if (!room) return;

        if (!room.queue.includes(songId)) {
          room.queue.push(songId);
          await room.save();
        }

        await room.populate('queue', 'title artist thumbnailUrl duration');

        io.to(roomCode).emit('queue-updated', { queue: room.queue });
      } catch (err) {
        socket.emit('error', { message: 'Failed to update queue' });
      }
    });

    // ─── Disconnect ────────────────────────────────────────────
    socket.on('disconnect', () => {
      if (socket.currentRoom) {
        handleLeaveRoom(socket, socket.currentRoom);
      }
      console.log(`🔌 Disconnected: ${socket.user?.username}`);
    });
  });

  // ─── Helper: Handle user leaving a room ─────────────────────
  const handleLeaveRoom = (socket, roomCode) => {
    socket.leave(roomCode);

    if (roomUsers[roomCode]) {
      roomUsers[roomCode] = roomUsers[roomCode].filter(u => u.socketId !== socket.id);

      if (roomUsers[roomCode].length === 0) {
        delete roomUsers[roomCode];
      } else {
        socket.to(roomCode).emit('user-left', {
          userId: socket.user._id,
          username: socket.user.username,
          users: roomUsers[roomCode],
        });
      }
    }
  };
};
