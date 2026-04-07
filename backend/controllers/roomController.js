// controllers/roomController.js — Room CRUD + messaging

const Room = require('../models/Room');
const Message = require('../models/Message');
const crypto = require('crypto');

// Generate a unique 6-char room code
const generateCode = () => crypto.randomBytes(3).toString('hex').toUpperCase();

// ─── @POST /api/rooms ────────────────────────────────────────
const createRoom = async (req, res, next) => {
  try {
    const { name } = req.body;
    let code = generateCode();

    // Ensure unique code
    while (await Room.findOne({ code })) {
      code = generateCode();
    }

    const room = await Room.create({
      name,
      code,
      host: req.user._id,
    });

    await room.populate('host', 'username avatar');

    res.status(201).json({ success: true, data: room });
  } catch (err) { next(err); }
};

// ─── @GET /api/rooms ─────────────────────────────────────────
const getRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find({ isActive: true })
      .populate('host', 'username avatar')
      .populate('currentSong', 'title artist thumbnailUrl')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: rooms });
  } catch (err) { next(err); }
};

// ─── @GET /api/rooms/:code ───────────────────────────────────
const getRoomByCode = async (req, res, next) => {
  try {
    const room = await Room.findOne({ code: req.params.code.toUpperCase(), isActive: true })
      .populate('host', 'username avatar')
      .populate('currentSong')
      .populate('queue', 'title artist thumbnailUrl duration');

    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    res.json({ success: true, data: room });
  } catch (err) { next(err); }
};

// ─── @DELETE /api/rooms/:id ──────────────────────────────────
const closeRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    if (room.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only host can close the room' });
    }

    room.isActive = false;
    await room.save();
    res.json({ success: true, message: 'Room closed' });
  } catch (err) { next(err); }
};

// ─── @GET /api/rooms/:id/messages ───────────────────────────
const getMessages = async (req, res, next) => {
  try {
    const messages = await Message.find({ room: req.params.id })
      .populate('sender', 'username avatar')
      .sort({ createdAt: 1 })
      .limit(100);

    res.json({ success: true, data: messages });
  } catch (err) { next(err); }
};

module.exports = { createRoom, getRooms, getRoomByCode, closeRoom, getMessages };
