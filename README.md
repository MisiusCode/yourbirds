# YourBirds

A bird photography community platform with AI-powered species identification, Lithuanian language support, and a full-screen gallery experience.

**Live:** https://d3002nen3zwivk.cloudfront.net

---

## Features

### Photography
- **Multi-photo upload** — drag & drop up to 10 photos at once for a single bird observation; photos are grouped together
- **Full-resolution view** — hover button on any photo opens the original file
- **EXIF metadata** — camera model, aperture, ISO, focal length, GPS coordinates extracted automatically
- **Auto thumbnails** — sharp generates 400px thumbnails for fast gallery loading

### AI Species Identification
- **Claude vision** — identifies bird species from the uploaded photo (thumbnail used to avoid size limits)
- **Optional trigger** — AI identification is a manual button, not automatic after upload
- **Lithuanian bird names** — official names from *Lietuvos paukščių sąrašas* (~200 species), stored in DynamoDB
- **User-editable names** — Lithuanian, English, and Latin names can be edited inline; Lithuanian name corrections persist to the shared species database
- **Bird facts** — AI-generated interesting facts about identified species, available in English and Lithuanian

### Gallery
- **Full-screen two-panel home page** — new uploads (70% width) alongside most-liked photos (30% width), each scrolling independently without visible scrollbars
- **Hover overlay** — bird species, author, date, and rating appear on hover; text hidden at idle
- **Grouped photo cards** — multiple photos of the same bird are shown as a single card; hover and slide the mouse left→right to browse through all shots in the group; progress dots indicate position
- **Medal badges** — top 3 most-liked photos get medal indicators

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

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3 + Vite 6 + TailwindCSS v4 + Pinia + Vue Router |
| Backend | Node.js 24 + Express (ES modules) |
| Database | Amazon DynamoDB (5 tables — users, photos, votes, birdnames, sessions) |
| Storage | Amazon S3 (`yourbirds-media-647926791613`, eu-north-1) |
| AI | Anthropic Claude (vision + text enrichment) |
| Auth | Google OAuth 2.0 + bcryptjs + express-session |
| Images | sharp (thumbnails) + exifr (EXIF) + multer (upload) |
| Sessions | Custom DynamoDBSessionStore (extends express-session Store) |

### AWS Infrastructure

| Service | Role | Config |
|---------|------|--------|
| CloudFront `E1FEBBXQZL9NWR` | HTTPS termination, unified domain | `/api/*` and `/auth/*` → EB; `/*` → Amplify |
| Elastic Beanstalk `yourbirds-prod` | Node.js 24 backend | eu-north-1, t3.micro |
| AWS Amplify `d2n6mvrg9umnw9` | Vue SPA build + CDN | auto-deploys on push to master |
| DynamoDB | Database | PAY_PER_REQUEST, eu-north-1 |
| S3 | Photo + thumbnail storage | public read, eu-north-1 |
| IAM | `yourbirds` user + `yourbirds-app-policy` + EB instance role | |

### Architecture: unified CloudFront domain

```
User browser
     │
     ▼
CloudFront d3002nen3zwivk.cloudfront.net   ← single domain (HTTPS)
     │
     ├── /api/*  ──────────────────────────► Elastic Beanstalk (HTTP internally)
     ├── /auth/* ──────────────────────────► Elastic Beanstalk
     ├── /health ──────────────────────────► Elastic Beanstalk
     │
     └── /* (everything else) ─────────────► AWS Amplify (Vue SPA)
```

Frontend and API are on the **same domain**, so session cookies work without cross-domain restrictions. CloudFront handles HTTPS — EB receives HTTP internally with `CloudFront-Forwarded-Proto: https` header.

---

## Local Development

See [LOCAL_DEV.md](LOCAL_DEV.md) for full instructions on running the stack locally with DynamoDB Local (Docker) instead of AWS.

**Quick start:**

```powershell
# 1. Start DynamoDB Local (Docker required)
.\start-dynamodb.ps1

# 2. First time only — create all DynamoDB tables locally
node backend/scripts/setupLocalTables.js

# 3. Start backend (port 3000)
.\start-backend.ps1

# 4. Start frontend (port 5173)
.\start-frontend.ps1
```

Open http://localhost:5173

---

## Deployment

### Automatic (GitHub Actions)

Push to `master` — the workflow in [.github/workflows/deploy-backend.yml](.github/workflows/deploy-backend.yml) zips and deploys to Elastic Beanstalk automatically when `backend/`, `Procfile`, `.ebextensions/`, or `.platform/` change.

Frontend deploys automatically via AWS Amplify on every push to `master`.

**Required GitHub Secrets:**
- `AWS_ACCESS_KEY_ID` — IAM user `yourbirds` access key
- `AWS_SECRET_ACCESS_KEY` — IAM user `yourbirds` secret key

### Manual backend deploy

```bash
# From project root — zip and deploy to EB
zip -r deploy.zip . \
  --exclude "*.git*" \
  --exclude "frontend/node_modules/*" \
  --exclude "frontend/dist/*" \
  --exclude "backend/uploads/*"

# Then use AWS Console, eb CLI, or the GitHub Actions workflow_dispatch trigger
```

### Production environment variables (Elastic Beanstalk)

Set via AWS Console → Elastic Beanstalk → yourbirds-prod → Configuration → Environment properties:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `8080` |
| `SESSION_SECRET` | (32+ random chars) |
| `COOKIE_SECURE` | `true` |
| `COOKIE_SAMESITE` | `lax` |
| `AWS_REGION` | `eu-north-1` |
| `S3_BUCKET` | `yourbirds-media-647926791613` |
| `FRONTEND_URL` | `https://d3002nen3zwivk.cloudfront.net` |
| `GOOGLE_CLIENT_ID` | (from Google Cloud Console) |
| `GOOGLE_CLIENT_SECRET` | (from Google Cloud Console) |
| `GOOGLE_CALLBACK_URL` | `https://d3002nen3zwivk.cloudfront.net/auth/google/callback` |
| `ANTHROPIC_API_KEY` | `sk-ant-...` |

No `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` needed in production — the EB instance role (`aws-elasticbeanstalk-ec2-role` with `yourbirds-app-policy` attached) provides credentials automatically.

### Production environment variables (AWS Amplify)

Set via AWS Console → Amplify → yourbirds → Environment variables:

| Variable | Value |
|----------|-------|
| `VITE_UPLOADS_URL` | `https://yourbirds-media-647926791613.s3.amazonaws.com` |
| `VITE_FACEBOOK_SHARE` | `false` |

`VITE_API_URL` is not set — the frontend uses relative URLs (`/api/...`, `/auth/...`) which route through CloudFront to the EB backend.

---

## Google OAuth Setup

1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. **Authorized redirect URIs:**
   - `http://localhost:3000/auth/google/callback` (local dev)
   - `https://d3002nen3zwivk.cloudfront.net/auth/google/callback` (production)
4. **Authorized JavaScript origins:**
   - `http://localhost:5173`
   - `https://d3002nen3zwivk.cloudfront.net`

---

## Project Structure

```
yourbirds/
├── .env                       ← local dev config (gitignored — never commit)
├── .env.example               ← template with placeholder values (committed)
├── Procfile                   ← tells EB to run: node backend/server.js
├── amplify.yml                ← Amplify build config
├── LOCAL_DEV.md               ← local development instructions
├── start-backend.ps1
├── start-frontend.ps1
├── start-dynamodb.ps1         ← starts DynamoDB Local via Docker
│
├── .ebextensions/             ← Elastic Beanstalk config
│   └── node.config            ← NODE_ENV=production, PORT=8080
│
├── .platform/                 ← EB platform hooks
│   └── nginx/conf.d/
│       └── uploads.conf       ← client_max_body_size 50M (allows large photo uploads)
│
├── .github/workflows/
│   └── deploy-backend.yml     ← auto-deploys to EB on push to master
│
├── backend/
│   ├── server.js              ← Express app, session config, CloudFront middleware
│   ├── db/
│   │   ├── dynamodb.js        ← DynamoDB Document Client + table name constants
│   │   └── sessionStore.js    ← Custom DynamoDBSessionStore (extends express-session Store)
│   ├── middleware/
│   │   ├── auth.js            ← requireAuth guard
│   │   └── upload.js          ← multer config (local disk or memory for S3)
│   ├── routes/
│   │   ├── auth.js            ← register, login, logout, Google OAuth, /me
│   │   ├── photos.js          ← gallery, upload, detail, update, delete
│   │   ├── votes.js           ← get/set/delete star rating
│   │   └── ai.js              ← species identify + enrich
│   ├── services/
│   │   ├── anthropicService.js   ← Claude vision API calls
│   │   ├── birdNameService.js    ← DynamoDB lookups for Lithuanian names
│   │   ├── lithuanianNames.js    ← static ~200-species seed data
│   │   ├── exifService.js        ← EXIF extraction via exifr
│   │   ├── imageService.js       ← sharp thumbnail generation
│   │   └── s3Service.js          ← S3 upload/download/delete
│   ├── scripts/
│   │   └── setupLocalTables.js   ← creates DynamoDB tables in DynamoDB Local (run once)
│   └── uploads/               ← local photo storage when S3_BUCKET not set (gitignored)
│
└── frontend/
    └── src/
        ├── components/
        │   ├── ai/            ← SpeciesPanel, BirdFacts
        │   ├── auth/          ← AuthModal
        │   ├── layout/        ← AppHeader (dark mode + language toggles)
        │   ├── photo/         ← GalleryCard (hover-scroll groups), PhotoCard,
        │   │                     PhotoGrid, ExifDisplay
        │   ├── profile/       ← Club250
        │   └── voting/        ← StarRating
        ├── i18n/              ← Full EN + LT translation dictionaries
        ├── stores/            ← auth, photos, settings (theme/lang with localStorage)
        ├── utils/
        │   └── photoUrl.js    ← thumbUrl() / origUrl() — switches between local and S3
        └── views/             ← Home, Upload, PhotoDetail, Profile
```

---

## API

```
# Auth
GET  /auth/me                    → current user
GET  /auth/google                → Google OAuth flow
POST /auth/login                 → { email, password } → { user }
POST /auth/register              → { name, email, password } → { user }
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
GET    /api/photos/:id/vote      → current user's vote for this photo
POST   /api/photos/:id/vote      → { stars: 1-5 } → set/update vote
DELETE /api/photos/:id/vote      → remove vote

# AI
POST   /api/ai/identify          → { photo_id } → identified species from thumbnail
POST   /api/ai/enrich            → { photo_id, latin_name } → names + facts
```

---

## DynamoDB Tables

| Table | PK | SK | GSIs |
|-------|----|----|------|
| `yourbirds-users` | `userId` | — | `email-index` (email), `google-index` (googleId) |
| `yourbirds-photos` | `photoId` | — | `gallery-index` (gsiPk/gsiSk), `user-index` (userId/createdAt), `group-index` (groupId/groupIndex) |
| `yourbirds-votes` | `photoId` | `userId` | — |
| `yourbirds-birdnames` | `latinName` | — | — |
| `yourbirds-sessions` | `id` | — | — |

---

## Notes

- **CloudFront → EB is HTTP internally.** CloudFront sends `CloudFront-Forwarded-Proto: https` (not the standard `X-Forwarded-Proto`). `server.js` patches `req.secure` manually based on this header so express-session sets Secure cookies correctly.
- **`req.session.save()` is explicit.** With `saveUninitialized: false`, new sessions must call `req.session.save(callback)` and respond only inside the callback. Without this, Set-Cookie is not sent on the first login response.
- **DynamoDB marshalling.** The `Cookie` class instance from express-session cannot be marshalled by the DynamoDB Document Client. `sessionStore.js` JSON round-trips the session before PutCommand to convert it to a plain object.
- On Windows, Node's built-in fetch (undici) may be intercepted by antivirus software. This project uses `node-fetch` passed directly to the Anthropic client constructor to work around this.
- AI identification uses **thumbnails**, not originals — original bird photos at 20 MB exceed API limits when base64-encoded.
- Lithuanian names are sourced from the official Lithuanian bird checklist. User corrections persist globally across all photos of that species via the `yourbirds-birdnames` DynamoDB table.
