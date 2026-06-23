# YourBirds 🦜

A bird photography community platform with AI-powered species identification, Lithuanian language support, and a full-screen gallery experience.

## Features

### Photography
- **Multi-photo upload** — drag & drop up to 10 photos at once for a single bird observation; photos are grouped together
- **Full-resolution view** — hover button on any photo opens the original file
- **EXIF metadata** — camera model, aperture, ISO, focal length, GPS coordinates extracted automatically
- **Auto thumbnails** — sharp generates 400px thumbnails for fast gallery loading

### AI Species Identification
- **Claude claude-opus-4-8 vision** — identifies bird species from the uploaded photo (thumbnail used to avoid size limits)
- **Optional trigger** — AI identification is a manual button, not automatic after upload
- **Lithuanian bird names** — official names from *Lietuvos paukščių sąrašas* (~200 species), stored in MongoDB
- **User-editable names** — Lithuanian, English, and Latin names can be edited inline; Lithuanian name corrections persist to the shared species database
- **Bird facts** — AI-generated interesting facts about identified species, available in English and Lithuanian

### Gallery
- **Full-screen two-panel home page** — new uploads (70% width) alongside most-liked photos (30% width), each scrolling independently without visible scrollbars
- **Hover overlay** — bird species, author, date, and rating appear on hover; text hidden at idle
- **Grouped photo cards** — multiple photos of the same bird are shown as a single card; hover and slide the mouse left→right to browse through all shots in the group; progress dots indicate position
- **Medal badges** — 🥇🥈🥉 on the top 3 most-liked photos

### Community
- **Star rating** — community 1–5 star voting; cannot vote on your own photos
- **User profiles** — photo grid with upload count
- **Club 250** — annual tracker counting unique bird species photographed per year; progress bar toward 250 species; historical years comparable side by side; expandable species lists with first-seen dates

### Sharing
- **Share to Facebook** — auto-downloads the photo and opens Facebook with step-by-step instructions to attach it (Web Share API used on mobile for native share sheet)
- Toggle via `VITE_FACEBOOK_SHARE=true/false` in `.env`

### UI & Language
- **Dark mode** — full dark theme toggle, persisted across sessions
- **Lithuanian language** — complete EN/LT toggle for all UI text, bird facts, and species names
- **Responsive** — flexible grid adapts from regular screens up to ultrawide monitors (2–4 columns based on viewport)

### Auth
- **Google OAuth 2.0** — one-click login with Google
- **Email/password** — traditional register/login with bcrypt hashing

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3 + Vite 6 + TailwindCSS v4 + Pinia + Vue Router |
| Backend | Node.js 24 + Express (ES modules) |
| Database | MongoDB 8 + Mongoose |
| AI | Anthropic Claude claude-opus-4-8 (vision + enrichment) |
| Auth | Google OAuth 2.0 + bcryptjs |
| Images | sharp (thumbnails) + exifr (EXIF) + multer (upload) |
| Sessions | connect-mongo (MongoDB-backed) |

## Setup

### Prerequisites
- Node.js 20+
- MongoDB (local install or Atlas)
- Anthropic API key — [console.anthropic.com](https://console.anthropic.com/)
- Google OAuth credentials (optional — app works without it, Google login disabled)

### Installation

```bash
git clone https://github.com/MisiusCode/yourbirds.git
cd yourbirds

cd backend && npm install
cd ../frontend && npm install
```

### Configuration

Copy `.env.example` to `.env` in the project root and fill in your values:

```bash
cp .env.example .env
```

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/yourbirds
SESSION_SECRET=change-this-to-a-random-secret-32-chars-min

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# From https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-...

FRONTEND_URL=http://localhost:5173

# Frontend toggles
VITE_API_URL=http://localhost:3000
VITE_FACEBOOK_SHARE=false
```

**Google OAuth setup:**
1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Authorized redirect URI: `http://localhost:3000/auth/google/callback`

### Running

```bash
# Terminal 1 — MongoDB
mongod --dbpath ./data

# Terminal 2 — backend
cd backend && node server.js

# Terminal 3 — frontend
cd frontend && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Project Structure

```
yourbirds/
├── .env                  ← single config file for backend + frontend
├── .env.example          ← safe template (committed)
├── start-backend.ps1
├── start-frontend.ps1
├── start-mongodb.ps1
│
├── backend/
│   ├── server.js
│   ├── db/               # MongoDB connection
│   ├── middleware/        # auth guard, multer upload
│   ├── models/           # Photo, User, Vote, BirdName
│   ├── routes/           # photos, votes, ai, auth
│   ├── services/         # anthropicService, birdNameService, lithuanianNames,
│   │                     # exifService, imageService
│   └── uploads/          # originals/ + thumbnails/ (gitignored)
│
└── frontend/
    └── src/
        ├── components/
        │   ├── ai/        # SpeciesPanel, BirdFacts
        │   ├── auth/      # AuthModal
        │   ├── layout/    # AppHeader (dark mode + language toggles)
        │   ├── photo/     # GalleryCard (hover-scroll groups), PhotoCard,
        │   │              # PhotoGrid, ExifDisplay
        │   ├── profile/   # Club250
        │   └── voting/    # StarRating
        ├── i18n/          # Full EN + LT translation dictionaries
        ├── stores/        # auth, photos, settings (theme/lang with localStorage)
        └── views/         # Home, Upload, PhotoDetail, Profile
```

## API

```
# Auth
GET  /auth/me                    → current user
GET  /auth/google                → Google OAuth flow
POST /auth/login                 → email/password login
POST /auth/register              → register
POST /auth/logout                → end session

# Photos
GET    /api/photos               → gallery list (sort=newest|rating, page, limit)
                                   only groupIndex=0 photos; includes group siblings
GET    /api/photos/mine          → current user's photos
GET    /api/photos/mine/club250  → annual unique species stats
GET    /api/photos/:id           → single photo with group siblings
POST   /api/photos               → upload 1–10 files (multipart, field: files[])
PATCH  /api/photos/:id           → update title/description/ai fields
DELETE /api/photos/:id           → delete photo + files

# Votes
GET    /api/photos/:id/vote      → current user's vote
POST   /api/photos/:id/vote      → { stars: 1-5 }
DELETE /api/photos/:id/vote      → remove vote

# AI
POST   /api/ai/identify          → { photo_id } → species from thumbnail
POST   /api/ai/enrich            → { photo_id, latin_name } → names + facts
```

## Notes

- On Windows, Node's built-in fetch (undici) may be intercepted by antivirus software. This project uses `node-fetch` passed directly to the Anthropic client constructor to work around this.
- AI identification uses **thumbnails**, not originals — original bird photos at 20 MB exceed API limits when base64-encoded.
- Lithuanian names are sourced from the official Lithuanian bird checklist and stored in MongoDB. User corrections to Lithuanian names persist globally across all photos of that species.
