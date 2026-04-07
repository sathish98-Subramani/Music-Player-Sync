const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Song title is required'],
    trim: true,
  },
  artist: {
    type: String,
    required: [true, 'Artist name is required'],
    trim: true,
  },
  album: {
    type: String,
    default: 'Unknown Album',
    trim: true,
  },
  genre: {
    type: String,
    default: 'Tamil',
    enum: ['Tamil', 'Folk', 'Classical', 'Film', 'Devotional', 'Pop', 'Hip-Hop', 'Other'],
  },
  duration: {
    type: Number,
    default: 0,
  },
  audioUrl: {
    type: String,
    required: [true, 'Audio URL is required'],
  },
  audioPublicId: {
    type: String,
  },
  thumbnailUrl: {
    type: String,
    default: '',
  },
  thumbnailPublicId: String,
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  playCount: {
    type: Number,
    default: 0,
  },
  likes: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

songSchema.index({ title: 'text', artist: 'text', album: 'text' });

module.exports = mongoose.model('Song', songSchema);