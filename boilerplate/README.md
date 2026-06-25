# AWS Boilerplate: Express + DynamoDB + S3 + Elastic Beanstalk + Amplify + CloudFront

A production-ready boilerplate for Node.js web apps deployed on AWS. Extracted from the YourBirds project.

## What's included

| File | Purpose |
|------|---------|
| `backend/server.js` | Express app with DynamoDB sessions, CloudFront HTTPS fix, CORS |
| `backend/db/dynamodb.js` | DynamoDB Document Client setup (local + production) |
| `backend/db/sessionStore.js` | Custom express-session store backed by DynamoDB |
| `backend/services/s3Service.js` | S3 upload/download/delete helpers |
| `backend/scripts/setupLocalTables.js` | Create DynamoDB tables in DynamoDB Local (first-time setup) |
| `.ebextensions/node.config` | Elastic Beanstalk Node.js environment settings |
| `.platform/nginx/conf.d/uploads.conf` | Nginx: allow 50MB uploads (needed for photo/file apps) |
| `.github/workflows/deploy-backend.yml` | GitHub Actions: auto-deploy to EB on push |
| `amplify.yml` | AWS Amplify build config for a Vite frontend |
| `Procfile` | Tells EB how to start the Node.js app |
| `.env.example` | All required environment variables with descriptions |
| `iam-policy.json` | IAM policy granting the app access to DynamoDB + S3 |

## Architecture

```
User browser
     │
     ▼
CloudFront (HTTPS)           ← single domain for frontend + API
     │
     ├── /api/*  ──────────► Elastic Beanstalk  ──► DynamoDB
     ├── /auth/* ──────────► Elastic Beanstalk  ──► S3
     │
     └── /* ───────────────► AWS Amplify (Vite SPA)
```

## Key patterns

### CloudFront → EB HTTPS fix
CloudFront terminates HTTPS and sends requests to EB over HTTP internally. It sends `CloudFront-Forwarded-Proto: https` (not the standard `X-Forwarded-Proto`). Express's `trust proxy` doesn't read this header, so `req.secure` is `false` — which causes express-session to skip Set-Cookie for Secure cookies.

Fix (in `server.js`):
```js
app.use((req, res, next) => {
  if (req.headers['cloudfront-forwarded-proto'] === 'https') {
    Object.defineProperty(req, 'secure', { get: () => true, configurable: true });
  }
  next();
});
```

### DynamoDB session store
express-session's `Cookie` class instances can't be marshalled by the DynamoDB Document Client. JSON round-trip the session before saving:
```js
const sess = JSON.parse(JSON.stringify(session));
```

### Explicit session save
With `saveUninitialized: false`, new sessions must call `req.session.save(cb)` explicitly and respond only inside the callback. Otherwise Set-Cookie is not sent on the first login response.

### DynamoDB Local for local dev
Set `AWS_ENDPOINT_URL=http://localhost:8000` in `.env` to route all DynamoDB calls to a local Docker container. No real AWS credentials needed for local development.

## Setup

See [AWS one-time setup](#aws-one-time-setup) below.

---

## AWS one-time setup

### 1. DynamoDB tables

```bash
# Sessions table (required)
aws dynamodb create-table \
  --table-name myapp-sessions \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region eu-north-1

# Add your own tables here — copy the pattern above
```

### 2. S3 bucket

```bash
aws s3 mb s3://myapp-uploads --region eu-north-1

aws s3api put-public-access-block \
  --bucket myapp-uploads \
  --public-access-block-configuration \
  "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

aws s3api put-bucket-policy --bucket myapp-uploads --policy '{
  "Statement":[{"Effect":"Allow","Principal":"*","Action":"s3:GetObject","Resource":"arn:aws:s3:::myapp-uploads/*"}]
}'
```

### 3. IAM policy

```bash
aws iam create-policy \
  --policy-name myapp-policy \
  --policy-document file://iam-policy.json
```

Attach to the EB instance role (created automatically after `eb create`):
```bash
aws iam attach-role-policy \
  --role-name aws-elasticbeanstalk-ec2-role \
  --policy-arn arn:aws:iam::<ACCOUNT_ID>:policy/myapp-policy
```

### 4. Elastic Beanstalk

```bash
eb init myapp --platform "Node.js 24" --region eu-north-1
eb create myapp-prod --instance-type t3.micro
eb setenv NODE_ENV=production PORT=8080 SESSION_SECRET="..." # etc.
eb deploy
```

### 5. AWS Amplify

1. AWS Console → Amplify → New app → Host web app → GitHub
2. Select repo and branch
3. Amplify detects `amplify.yml` automatically
4. Add environment variables (`VITE_API_URL` etc.)

### 6. CloudFront

1. Create distribution, add two origins: Amplify and EB
2. Default behavior `/*` → Amplify (HTTPS only)
3. Add behavior `/api/*` → EB (All methods, all cookies, all headers, TTL=0)
4. Add behavior `/auth/*` → EB (same settings)
5. Update `FRONTEND_URL` and `GOOGLE_CALLBACK_URL` in EB env vars to the CloudFront domain

### 7. GitHub Actions secrets

Repository → Settings → Secrets → Actions:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
