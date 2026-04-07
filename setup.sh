#!/bin/bash
# setup.sh — Tamil Sync quick setup script
# Run this from the tamil-sync/ root directory

set -e

echo ""
echo "🎵 Tamil Sync — Setup Script"
echo "================================"
echo ""

# ─── Backend Setup ──────────────────────────────────────────
echo "📦 Installing backend dependencies..."
cd backend
npm install

if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Created backend/.env — please fill in your credentials!"
else
  echo "✅ backend/.env already exists"
fi

# ─── Frontend Setup ─────────────────────────────────────────
echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Created frontend/.env — update if deploying to production"
else
  echo "✅ frontend/.env already exists"
fi

echo ""
echo "================================"
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Fill in backend/.env with your MongoDB URI and Cloudinary keys"
echo "  2. Run 'npm run dev' in both backend/ and frontend/ folders"
echo "  3. Open http://localhost:5173 in your browser"
echo ""
echo "🎵 Happy listening!"
