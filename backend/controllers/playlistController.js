// controllers/playlistController.js — CRUD for playlists

const Playlist = require('../models/Playlist');

// Get all public playlists (or user's own)
const getPlaylists = async (req, res, next) => {
  try {
    const playlists = await Playlist.find({
      $or: [{ isPublic: true }, { owner: req.user._id }],
    })
      .populate('owner', 'username avatar')
      .populate('songs', 'title artist thumbnailUrl duration')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: playlists });
  } catch (err) {
    next(err);
  }
};

// Get current user's playlists
const getMyPlaylists = async (req, res, next) => {
  try {
    const playlists = await Playlist.find({ owner: req.user._id })
      .populate('songs', 'title artist thumbnailUrl duration audioUrl')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: playlists });
  } catch (err) {
    next(err);
  }
};

// Get single playlist by ID
const getPlaylist = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate('owner', 'username avatar')
      .populate({
        path: 'songs',
        populate: { path: 'uploadedBy', select: 'username' },
      });

    if (!playlist) return res.status(404).json({ success: false, message: 'Playlist not found' });

    res.json({ success: true, data: playlist });
  } catch (err) {
    next(err);
  }
};

// Create playlist
const createPlaylist = async (req, res, next) => {
  try {
    const { name, description, isPublic } = req.body;

    const playlist = await Playlist.create({
      name,
      description,
      isPublic: isPublic !== undefined ? isPublic : true,
      owner: req.user._id,
    });

    res.status(201).json({ success: true, data: playlist });
  } catch (err) {
    next(err);
  }
};

// Update playlist name/description
const updatePlaylist = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ success: false, message: 'Playlist not found' });

    if (playlist.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updated = await Playlist.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('songs', 'title artist thumbnailUrl duration audioUrl');

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// Add song to playlist
const addSong = async (req, res, next) => {
  try {
    const { songId } = req.body;
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ success: false, message: 'Playlist not found' });

    if (playlist.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (playlist.songs.includes(songId)) {
      return res.status(400).json({ success: false, message: 'Song already in playlist' });
    }

    playlist.songs.push(songId);
    await playlist.save();

    res.json({ success: true, message: 'Song added to playlist' });
  } catch (err) {
    next(err);
  }
};

// Remove song from playlist
const removeSong = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ success: false, message: 'Playlist not found' });

    if (playlist.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    playlist.songs = playlist.songs.filter(s => s.toString() !== req.params.songId);
    await playlist.save();

    res.json({ success: true, message: 'Song removed from playlist' });
  } catch (err) {
    next(err);
  }
};

// Delete playlist
const deletePlaylist = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ success: false, message: 'Playlist not found' });

    if (playlist.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await playlist.deleteOne();
    res.json({ success: true, message: 'Playlist deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPlaylists, getMyPlaylists, getPlaylist, createPlaylist, updatePlaylist, addSong, removeSong, deletePlaylist };
