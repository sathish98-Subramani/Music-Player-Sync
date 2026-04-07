// routes/history.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getHistory, clearHistory } = require('../controllers/historyController');

router.get('/',    protect, getHistory);
router.delete('/', protect, clearHistory);

module.exports = router;
