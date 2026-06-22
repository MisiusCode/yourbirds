# YourBirds 🦜

A bird photography community platform with AI-powered species identification.

## Features

- **Photo upload** — drag & drop, EXIF metadata extraction, auto thumbnail generation
- **AI identification** — Claude claude-opus-4-8 vision model identifies bird species from photos
- **Lithuanian bird names** — official names from Lietuvos paukščių sąrašas (200+ species), stored in MongoDB and editable by users
- **Bird facts** — AI-generated facts about identified species, available in English and Lithuanian
- **Star rating** — community voting system (1–5 stars)
- **Club 250** — annual tracker for unique species photographed per year, with historical year comparison
- **Dark mode** — full dark theme toggle
- **Lithuanian language** — full website translation (EN/LT toggle)
- **Auth** — Google OAuth + email/password login

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3 + Vite 6 + TailwindCSS v4 + Pinia + Vue Router |
| Backend | Node.js 24 + Express (ES modules) |
| Database | MongoDB 8 + Mongoose |
| AI | Anthropic Claude claude-opus-4-8 (vision) + claude-haiku-4-5 (text) |
| Auth | Google OAuth 2.0 + bcryptjs sessions |
| Images | sharp (thumbnails) + exifr (EXIF extraction) |

## Setup

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- Anthropic API key
- Google OAuth credentials

### Installation

```bash
# Clone the repo
git clone https://github.com/MisiusCode/yourbirds.git
cd yourbirds

# Install backend dependencies
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials

# Install frontend dependencies
cd ../frontend
npm install
```

### Configuration

Edit `backend/.env`:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/yourbirds
SESSION_SECRET=your-random-secret-32-chars-min
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
ANTHROPIC_API_KEY=sk-ant-...
FRONTEND_URL=http://localhost:5173
```

**Google OAuth setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `http://localhost:3000/auth/google/callback`

### Running

```bash
# Terminal 1 — start MongoDB (if running locally)
mongod --dbpath ./data

# Terminal 2 — start backend
cd backend
node server.js

# Terminal 3 — start frontend
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Project Structure

```
yourbirds/
├── backend/
│   ├── .env.example
│   ├── server.js
│   ├── db/            # MongoDB connection
│   ├── middleware/    # auth guard, multer upload
│   ├── models/        # Mongoose schemas (Photo, User, Vote, BirdName)
│   ├── routes/        # photos, votes, ai, auth
│   └── services/      # anthropicService, birdNameService, exifService, imageService
└── frontend/
    └── src/
        ├── components/
        │   ├── ai/        # SpeciesPanel, BirdFacts
        │   ├── auth/      # AuthModal
        │   ├── layout/    # AppHeader
        │   ├── photo/     # PhotoCard, PhotoGrid, ExifDisplay
        │   ├── profile/   # Club250
        │   └── voting/    # StarRating
        ├── i18n/          # EN + LT translations
        ├── stores/        # auth, photos, settings (theme/lang)
        └── views/         # Home, Upload, PhotoDetail, Profile
```

## API

```
GET  /auth/me                    → current user
GET  /auth/google                → Google OAuth flow
POST /auth/login                 → email/password login
POST /auth/register              → register new user
POST /auth/logout                → end session

GET    /api/photos               → list (sort=newest|rating, page, limit)
GET    /api/photos/mine          → current user's photos
GET    /api/photos/mine/club250  → annual species stats
GET    /api/photos/:id           → single photo
POST   /api/photos               → upload photo (multipart)
PATCH  /api/photos/:id           → update title/description/ai fields
DELETE /api/photos/:id           → delete photo

GET    /api/photos/:id/vote      → current user's vote
POST   /api/photos/:id/vote      → cast vote { stars: 1-5 }
DELETE /api/photos/:id/vote      → remove vote

POST   /api/ai/identify          → identify species from photo
POST   /api/ai/enrich            → get names + facts for species
```
