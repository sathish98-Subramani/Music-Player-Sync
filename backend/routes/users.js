// routes/users.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');
const { protect } = require('../middleware/auth');
const { getProfile, updateProfile, changePassword } = require('../controllers/userController');

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'tamil-sync/avatars', resource_type: 'image', transformation: [{ width: 200, height: 200, crop: 'fill' }] },
});
const avatarUpload = multer({ storage: avatarStorage, limits: { fileSize: 2 * 1024 * 1024 } });

router.get('/:id',         protect, getProfile);
router.put('/profile',     protect, avatarUpload.single('avatar'), updateProfile);
router.put('/password',    protect, changePassword);

module.exports = router;
