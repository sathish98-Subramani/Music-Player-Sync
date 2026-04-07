const express = require('express');
const router = express.Router();
const multer = require('multer');

const { protect } = require('../middleware/auth');
const {
  getAllSongs,
  getTrending,
  searchSongs,
  getSong,
  uploadSong,
  playSong,
  deleteSong
} = require('../controllers/songController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

router.get('/', getAllSongs);
router.get('/trending', getTrending);
router.get('/search', searchSongs);
router.get('/:id', getSong);

router.post(
  '/',
  protect,
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  uploadSong
);

router.post('/:id/play', protect, playSong);
router.delete('/:id', protect, deleteSong);

module.exports = router;