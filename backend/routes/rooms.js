// routes/rooms.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createRoom, getRooms, getRoomByCode, closeRoom, getMessages } = require('../controllers/roomController');

router.get('/',              protect, getRooms);
router.post('/',             protect, createRoom);
router.get('/:code',         protect, getRoomByCode);
router.delete('/:id',        protect, closeRoom);
router.get('/:id/messages',  protect, getMessages);

module.exports = router;
