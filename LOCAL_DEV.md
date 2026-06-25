# Local Development

Run the full YourBirds stack locally using **DynamoDB Local** (a Docker container that mimics real DynamoDB) and local disk for photos. No AWS account or credentials needed for everyday development.

---

## Prerequisites

- **Node.js 20+**
- **Docker Desktop** — [download](https://www.docker.com/products/docker-desktop), install, and start it before running anything

---

## First-time setup

### 1. Install dependencies

```powershell
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment

The `.env` file in the project root is already configured for local dev. Verify these values are set:

```env
AWS_ENDPOINT_URL=http://localhost:8000   # routes DynamoDB calls to local container
# S3_BUCKET is commented out             # photos stored locally in backend/uploads/
VITE_UPLOADS_URL=http://localhost:3000/uploads
```

The real AWS credentials in `.env` are only needed if you uncomment `S3_BUCKET` to upload photos to the production S3 bucket during local dev. For purely local dev (photos on disk), the credentials are not used because `AWS_ENDPOINT_URL` overrides the endpoint.

### 3. Start DynamoDB Local

```powershell
.\start-dynamodb.ps1
```

This runs `amazon/dynamodb-local` as a Docker container on port 8000. If the container already exists from a previous session, start it with:

```powershell
docker start dynamodb-local
```

Verify it's running:

```powershell
curl http://localhost:8000/shell
# should return an HTML page
```

### 4. Create DynamoDB tables (once per machine)

Tables persist in the Docker container until it is deleted. Run this once:

```powershell
node backend/scripts/setupLocalTables.js
```

Expected output:
```
Created yourbirds-users
Created yourbirds-photos
Created yourbirds-votes
Created yourbirds-birdnames
Created yourbirds-sessions
All tables ready.
```

If you see "Table already exists" for all tables, they're already set up — that's fine.

---

## Daily startup

After the first-time setup, every dev session is:

```powershell
# Terminal 1 — DynamoDB Local
docker start dynamodb-local

# Terminal 2 — backend (port 3000)
.\start-backend.ps1

# Terminal 3 — frontend (port 5173)
.\start-frontend.ps1
```

Open http://localhost:5173

---

## What works locally vs what differs from production

| Feature | Local | Production |
|---------|-------|-----------|
| DynamoDB | DynamoDB Local (Docker, port 8000) | Real DynamoDB (eu-north-1) |
| Photos | Stored in `backend/uploads/` | Amazon S3 `yourbirds-media-647926791613` |
| Photo URLs | `http://localhost:3000/uploads/...` | `https://yourbirds-media-647926791613.s3.amazonaws.com/...` |
| HTTPS | None (HTTP only) | CloudFront terminates HTTPS |
| Session cookies | `Secure: false` (no HTTPS) | `Secure: true` |
| Google OAuth | Uses `localhost:3000` callback | Uses CloudFront domain callback |
| Frontend URL | `http://localhost:5173` | `https://d3002nen3zwivk.cloudfront.net` |

---

## Local photo storage

When `S3_BUCKET` is not set, `backend/routes/photos.js` saves files to `backend/uploads/originals/` and `backend/uploads/thumbnails/`. The backend serves these statically:

```js
// server.js — only active in non-production
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

`VITE_UPLOADS_URL=http://localhost:3000/uploads` tells the frontend to build photo URLs against this local path.

---

## Google OAuth locally

Google OAuth works locally if you add `http://localhost:3000/auth/google/callback` as an authorized redirect URI in [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → your OAuth client.

The client ID and secret are already in `.env`. Only the redirect URI in Google's console needs to include the localhost variant.

---

## Inspect DynamoDB data locally

Use [NoSQL Workbench](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/workbench.settingup.html) (free AWS tool):

1. Download and install NoSQL Workbench
2. Open → **Operation builder** → **Add connection** → **DynamoDB local** → port 8000
3. Browse and query tables visually

Or with AWS CLI (DynamoDB Local accepts any credentials):

```bash
aws dynamodb scan --table-name yourbirds-sessions \
  --endpoint-url http://localhost:8000 \
  --region eu-north-1
```

---

## Reset local data

To start fresh (wipe all local DynamoDB data):

```powershell
docker stop dynamodb-local
docker rm dynamodb-local
.\start-dynamodb.ps1
node backend/scripts/setupLocalTables.js
```

---

## Switching to real AWS locally

To develop against real DynamoDB and S3 (useful for testing production data):

1. Comment out `AWS_ENDPOINT_URL` in `.env`
2. Uncomment `S3_BUCKET=yourbirds-media-647926791613`
3. Update `VITE_UPLOADS_URL=https://yourbirds-media-647926791613.s3.amazonaws.com`
4. Restart the backend

The real AWS credentials in `.env` (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) will be picked up automatically. Be careful — this writes to and reads from the production database and S3 bucket.
