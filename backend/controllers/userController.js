// controllers/userController.js — Profile management

const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');

// ─── @GET /api/users/:id ─────────────────────────────────────
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// ─── @PUT /api/users/profile ─────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const { username, bio } = req.body;
    const updates = {};
    if (username) updates.username = username;
    if (bio !== undefined) updates.bio = bio;

    // Handle avatar upload
    if (req.file) {
      // Delete old avatar from Cloudinary if exists
      if (req.user.avatar) {
        const publicId = req.user.avatar.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`tamil-sync/avatars/${publicId}`).catch(() => {});
      }
      updates.avatar = req.file.path;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// ─── @PUT /api/users/password ────────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) { next(err); }
};

module.exports = { getProfile, updateProfile, changePassword };
