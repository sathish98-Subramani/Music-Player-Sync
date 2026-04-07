// controllers/historyController.js

const History = require('../models/History');

const getHistory = async (req, res, next) => {
  try {
    const history = await History.find({ user: req.user._id })
      .populate({ path: 'song', populate: { path: 'uploadedBy', select: 'username' } })
      .sort({ playedAt: -1 })
      .limit(50);

    res.json({ success: true, data: history });
  } catch (err) { next(err); }
};

const clearHistory = async (req, res, next) => {
  try {
    await History.deleteMany({ user: req.user._id });
    res.json({ success: true, message: 'History cleared' });
  } catch (err) { next(err); }
};

module.exports = { getHistory, clearHistory };
