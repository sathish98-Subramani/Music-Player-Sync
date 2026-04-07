// models/Room.js — Collaborative listening room

const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true,
    maxlength: [60, 'Room name cannot exceed 60 characters'],
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    length: 6,
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Current playback state
  currentSong: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song',
    default: null,
  },
  currentTime: {
    type: Number,
    default: 0,
  },
  isPlaying: {
    type: Boolean,
    default: false,
  },
  queue: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song',
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
