import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
dotenvConfig({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { DynamoDBSessionStore } from './db/sessionStore.js';

const app = express();

// Trust ALB headers (needed for req.ip, req.protocol when behind load balancer)
app.set('trust proxy', 1);

// CloudFront sends CloudFront-Forwarded-Proto: https (not X-Forwarded-Proto).
// Express's trust proxy doesn't read this header, so req.secure stays false —
// which causes express-session to skip Set-Cookie for Secure cookies.
// Patch req.secure manually based on the CloudFront header.
app.use((req, res, next) => {
  if (req.headers['cloudfront-forwarded-proto'] === 'https') {
    Object.defineProperty(req, 'secure', { get: () => true, configurable: true });
  }
  next();
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

app.use(session({
  store: new DynamoDBSessionStore(),
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: process.env.COOKIE_SAMESITE || 'lax',
    // COOKIE_SECURE=true in production; false locally (no HTTPS)
    secure: process.env.COOKIE_SECURE === 'true',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

// Health check — Elastic Beanstalk pings this to decide if the app is healthy
app.get('/health', (_, res) => res.json({ status: 'ok' }));

// Mount your routes here:
// app.use('/api/items', itemsRoutes);
// app.use('/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
