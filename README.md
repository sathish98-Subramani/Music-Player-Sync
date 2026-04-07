# 🎵 Tamil Sync — Music Player App

A full-stack Spotify-like music streaming app with real-time collaborative listening rooms, built with React, Node.js, MongoDB, Socket.IO, and Cloudinary.

---

## 📁 Project Structure

```
tamil-sync/
├── backend/
│   ├── config/
│   │   └── cloudinary.js       # Cloudinary SDK setup
│   ├── controllers/
│   │   ├── authController.js   # Register, Login, Me
│   │   ├── songController.js   # Upload, list, search songs
│   │   ├── playlistController.js
│   │   ├── favoriteController.js
│   │   ├── historyController.js
│   │   ├── roomController.js   # Room CRUD + messages
│   │   └── userController.js   # Profile management
│   ├── middleware/
│   │   ├── auth.js             # JWT middleware
│   │   └── errorHandler.js     # Global error handler
│   ├── models/
│   │   ├── User.js
│   │   ├── Song.js
│   │   ├── Playlist.js
│   │   ├── Favorite.js
│   │   ├── History.js
│   │   ├── Room.js
│   │   └── Message.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── songs.js
│   │   ├── playlists.js
│   │   ├── favorites.js
│   │   ├── history.js
│   │   ├── rooms.js
│   │   └── users.js
│   ├── utils/
│   │   └── socketHandler.js    # Socket.IO room logic
│   ├── server.js               # Entry point
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── axios.js        # Axios instance + interceptors
    │   ├── components/
    │   │   ├── common/
    │   │   │   ├── Layout.jsx
    │   │   │   ├── Sidebar.jsx
    │   │   │   ├── SongCard.jsx
    │   │   │   ├── SongRow.jsx
    │   │   │   └── Skeleton.jsx
    │   │   └── player/
    │   │       └── Player.jsx  # Sticky bottom player
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── SignupPage.jsx
    │   │   ├── HomePage.jsx
    │   │   ├── SearchPage.jsx
    │   │   ├── LibraryPage.jsx
    │   │   ├── PlaylistPage.jsx
    │   │   ├── UploadPage.jsx
    │   │   ├── RoomsListPage.jsx
    │   │   ├── RoomPage.jsx    # Real-time sync room
    │   │   └── ProfilePage.jsx
    │   ├── store/
    │   │   ├── authStore.js    # Zustand auth state
    │   │   └── playerStore.js  # Zustand player state
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── .env.example
    └── package.json
```

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Cloudinary account (free tier works)

### Step 1: Clone and install

```bash
# Backend
cd tamil-sync/backend
cp .env.example .env       # Fill in your values
npm install

# Frontend
cd ../frontend
cp .env.example .env       # Fill in your values
npm install
```

### Step 2: Fill in `.env` files

**backend/.env:**
```env
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/tamil-sync
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:5173
```

**frontend/.env:**
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Step 3: Start the app

```bash
# Terminal 1 — Backend
cd backend
npm run dev       # Uses nodemon for hot reload

# Terminal 2 — Frontend
cd frontend
npm run dev       # Vite dev server on :5173
```

Visit: **http://localhost:5173**

---

## ☁️ Cloudinary Setup

1. Go to https://cloudinary.com and sign up (free)
2. From your dashboard, copy:
   - Cloud Name
   - API Key
   - API Secret
3. Paste into `backend/.env`

Audio files go to `tamil-sync/audio/` folder.
Images go to `tamil-sync/thumbnails/` folder.

---

## 🗄️ MongoDB Atlas Setup

1. Go to https://cloud.mongodb.com
2. Create a free cluster
3. Create a database user (remember password)
4. Whitelist your IP (or 0.0.0.0/0 for all)
5. Get connection string → paste as `MONGO_URI`

---

## 🚢 Deployment

### Backend → Render (free tier)

1. Push backend to GitHub
2. Go to https://render.com → New Web Service
3. Connect your repo, set **Root Directory** to `backend`
4. Build command: `npm install`
5. Start command: `node server.js`
6. Add all environment variables from `.env`
7. Deploy!

### Frontend → Vercel (free tier)

1. Push frontend to GitHub
2. Go to https://vercel.com → New Project
3. Import your repo, set **Root Directory** to `frontend`
4. Framework preset: **Vite**
5. Add environment variables:
   - `VITE_API_URL=https://your-render-backend.onrender.com/api`
   - `VITE_SOCKET_URL=https://your-render-backend.onrender.com`
6. Deploy!

### After deploying backend, update `CLIENT_URL` on Render to your Vercel URL.

---

## 🔑 API Reference

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| GET | /api/songs | List all songs |
| GET | /api/songs/trending | Top songs by plays |
| GET | /api/songs/search?q= | Search songs |
| POST | /api/songs | Upload song |
| DELETE | /api/songs/:id | Delete song |
| GET | /api/playlists/mine | Your playlists |
| POST | /api/playlists | Create playlist |
| POST | /api/playlists/:id/songs | Add song to playlist |
| GET | /api/favorites | Your favorites |
| POST | /api/favorites/toggle | Like/unlike song |
| GET | /api/history | Listening history |
| GET | /api/rooms | Active rooms |
| POST | /api/rooms | Create room |
| GET | /api/rooms/:code | Get room by code |

---

## ⚡ Socket.IO Events

| Event | Direction | Description |
|-------|-----------|-------------|
| join-room | Client→Server | Join a sync room |
| room-state | Server→Client | Current room state |
| playback-control | Client→Server | Host controls (play/pause/seek) |
| playback-update | Server→All | Broadcast state change |
| send-message | Client→Server | Chat message |
| new-message | Server→All | New chat message |
| user-joined | Server→Others | Someone joined |
| user-left | Server→Others | Someone left |
| add-to-queue | Client→Server | Add song to room queue |
| queue-updated | Server→All | Queue changed |

---

## 🛡️ Security Features

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens with 7-day expiry
- Protected routes on backend and frontend
- File type validation on upload
- Input validation with express-validator
- CORS configured for specific origins
- Admin role for elevated permissions

---

## 🎨 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| State | Zustand |
| Routing | React Router v6 |
| HTTP | Axios |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Real-time | Socket.IO |
| Storage | Cloudinary |
| Validation | express-validator |
