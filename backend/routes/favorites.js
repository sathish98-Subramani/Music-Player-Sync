// routes/favorites.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getFavorites, toggleFavorite, checkFavorite } = require('../controllers/favoriteController');

router.get('/',                      protect, getFavorites);
router.post('/toggle',               protect, toggleFavorite);
router.get('/check/:songId',         protect, checkFavorite);

module.exports = router;
