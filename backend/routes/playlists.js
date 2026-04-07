// routes/playlists.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getPlaylists, getMyPlaylists, getPlaylist,
  createPlaylist, updatePlaylist, addSong,
  removeSong, deletePlaylist
} = require('../controllers/playlistController');

router.get('/',              protect, getPlaylists);
router.get('/mine',          protect, getMyPlaylists);
router.get('/:id',           protect, getPlaylist);
router.post('/',             protect, createPlaylist);
router.put('/:id',           protect, updatePlaylist);
router.post('/:id/songs',    protect, addSong);
router.delete('/:id/songs/:songId', protect, removeSong);
router.delete('/:id',        protect, deletePlaylist);

module.exports = router;
