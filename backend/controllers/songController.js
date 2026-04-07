const streamifier = require('streamifier');
const { cloudinary } = require('../config/cloudinary');
const Song = require('../models/Song');

const uploadToCloudinary = (fileBuffer, folder, resourceType) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

// ✅ FIXED getAllSongs (supports filters)
const getAllSongs = async (req, res) => {
  try {
    const { genre, uploadedBy, limit } = req.query;

    const filter = {};

    if (genre && genre !== 'All') {
      filter.genre = genre;
    }

    if (uploadedBy) {
      filter.uploadedBy = uploadedBy;
    }

    let query = Song.find(filter)
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'username');

    if (limit) {
      query = query.limit(Number(limit));
    }

    const songs = await query;

    res.status(200).json(songs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ trending
const getTrending = async (req, res) => {
  try {
    const songs = await Song.find()
      .sort({ playCount: -1, createdAt: -1 })
      .limit(10);

    res.status(200).json(songs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ FIXED search (better + genre support)
const searchSongs = async (req, res) => {
  try {
    const q = req.query.q || '';

    const songs = await Song.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { artist: { $regex: q, $options: 'i' } },
        { album: { $regex: q, $options: 'i' } },
        { genre: { $regex: q, $options: 'i' } }
      ]
    })
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'username');

    res.status(200).json(songs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// get single
const getSong = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id).populate('uploadedBy', 'username');

    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    res.status(200).json(song);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// upload
const uploadSong = async (req, res) => {
  try {
    const { title, artist, album, genre, duration } = req.body;

    if (!req.files || !req.files.audio) {
      return res.status(400).json({ message: 'Audio file is required' });
    }

    const audioFile = req.files.audio[0];

    const audioResult = await uploadToCloudinary(
      audioFile.buffer,
      'tamil-sync/audio',
      'video'
    );

    let thumbnailUrl = '';
    let thumbnailPublicId = '';

    if (req.files.thumbnail && req.files.thumbnail[0]) {
      const imageFile = req.files.thumbnail[0];

      const imageResult = await uploadToCloudinary(
        imageFile.buffer,
        'tamil-sync/thumbnails',
        'image'
      );

      thumbnailUrl = imageResult.secure_url;
      thumbnailPublicId = imageResult.public_id;
    }

    const song = await Song.create({
      title,
      artist,
      album,
      genre,
      duration: duration || 0,
      audioUrl: audioResult.secure_url,
      audioPublicId: audioResult.public_id,
      thumbnailUrl,
      thumbnailPublicId,
      uploadedBy: req.user.id
    });

    res.status(201).json(song);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// play
const playSong = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);

    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    song.playCount += 1;
    await song.save();

    res.status(200).json({
      message: 'Play count updated',
      playCount: song.playCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// delete
const deleteSong = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);

    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    if (song.audioPublicId) {
      await cloudinary.uploader.destroy(song.audioPublicId, { resource_type: 'video' });
    }

    if (song.thumbnailPublicId) {
      await cloudinary.uploader.destroy(song.thumbnailPublicId, { resource_type: 'image' });
    }

    await Song.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Song deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllSongs,
  getTrending,
  searchSongs,
  getSong,
  uploadSong,
  playSong,
  deleteSong
};