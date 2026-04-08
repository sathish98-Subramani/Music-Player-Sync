// ============================================================
// server.js — Tamil Sync Music Player: Main Entry Point
// ============================================================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

console.log('PORT =', process.env.PORT);
console.log('CLIENT_URL =', process.env.CLIENT_URL);
console.log('MONGO_URI =', process.env.MONGO_URI);

// Allowed origins
const allowedOrigins = [
  'http://localhost:5173',
  process.env.CLIENT_URL, // main Vercel production URL
].filter(Boolean);

// Allow Vercel preview deployments also
const isAllowedOrigin = (origin) => {
  if (!origin) return true; // allow Postman/server-to-server requests
  if (allowedOrigins.includes(origin)) return true;

  // Allow Vercel preview URLs like:
  // https://music-player-sync-9846-xxxxx-karthi99412-5065s-projects.vercel.app
  if (/^https:\/\/music-player-sync-9846.*\.vercel\.app$/.test(origin)) {
    return true;
  }

  return false;
};

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by Socket.IO CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/songs', require('./routes/songs'));
app.use('/api/playlists', require('./routes/playlists'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/history', require('./routes/history'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/users', require('./routes/users'));

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Tamil Sync API is running' });
});

// Socket handlers
require('./utils/socketHandler')(io);

// Error handler
app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 5000;

mongoose.set('strictQuery', true);

mongoose
  .connect(process.env.MONGO_URI, {
    family: 4,
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });