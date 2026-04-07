// controllers/favoriteController.js

const Favorite = require('../models/Favorite');
const Song = require('../models/Song');

const getFavorites = async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id })
      .populate({ path: 'song', populate: { path: 'uploadedBy', select: 'username' } })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: favorites });
  } catch (err) { next(err); }
};

const toggleFavorite = async (req, res, next) => {
  try {
    const { songId } = req.body;
    const existing = await Favorite.findOne({ user: req.user._id, song: songId });

    if (existing) {
      await existing.deleteOne();
      await Song.findByIdAndUpdate(songId, { $inc: { likes: -1 } });
      return res.json({ success: true, favorited: false, message: 'Removed from favorites' });
    }

    await Favorite.create({ user: req.user._id, song: songId });
    await Song.findByIdAndUpdate(songId, { $inc: { likes: 1 } });
    res.json({ success: true, favorited: true, message: 'Added to favorites' });
  } catch (err) { next(err); }
};

const checkFavorite = async (req, res, next) => {
  try {
    const fav = await Favorite.findOne({ user: req.user._id, song: req.params.songId });
    res.json({ success: true, favorited: !!fav });
  } catch (err) { next(err); }
};

module.exports = { getFavorites, toggleFavorite, checkFavorite };
