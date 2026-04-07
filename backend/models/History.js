// models/History.js — Listening history per user

const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  song: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song',
    required: true,
  },
  playedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: false });

// Index for fast history lookup
historySchema.index({ user: 1, playedAt: -1 });

module.exports = mongoose.model('History', historySchema);
