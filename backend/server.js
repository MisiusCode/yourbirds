import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
dotenvConfig({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import path from 'path';
import fs from 'fs';
import { DynamoDBSessionStore } from './db/sessionStore.js';
import { db, TABLE_USERS } from './db/dynamodb.js';
import { QueryCommand, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import authRoutes from './routes/auth.js';
import photosRoutes from './routes/photos.js';
import votesRoutes from './routes/votes.js';
import aiRoutes from './routes/ai.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Keep local upload dirs for local dev (ignored when S3_BUCKET is set)
for (const dir of ['uploads/originals', 'uploads/thumbnails']) {
  fs.mkdirSync(path.join(__dirname, dir), { recursive: true });
}

const app = express();

// Trust ALB/proxy headers so req.protocol is correct when HTTPS is terminated at load balancer
app.set('trust proxy', 1);

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
    secure: process.env.COOKIE_SECURE === 'true',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

app.use(passport.initialize());

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const avatar = profile.photos?.[0]?.value || null;
        const googleId = profile.id;

        // Try by Google ID first
        const { Items: byGoogle } = await db.send(new QueryCommand({
          TableName: TABLE_USERS,
          IndexName: 'google-index',
          KeyConditionExpression: 'googleId = :gid',
          ExpressionAttributeValues: { ':gid': googleId },
        }));
        if (byGoogle?.length) return done(null, byGoogle[0]);

        // Try by email — merge Google ID onto existing account
        if (email) {
          const { Items: byEmail } = await db.send(new QueryCommand({
            TableName: TABLE_USERS,
            IndexName: 'email-index',
            KeyConditionExpression: 'email = :e',
            ExpressionAttributeValues: { ':e': email },
          }));
          if (byEmail?.length) {
            const user = byEmail[0];
            await db.send(new UpdateCommand({
              TableName: TABLE_USERS,
              Key: { userId: user.userId },
              UpdateExpression: 'SET googleId = :gid' + (!user.avatarUrl && avatar ? ', avatarUrl = :av' : ''),
              ExpressionAttributeValues: { ':gid': googleId, ...((!user.avatarUrl && avatar) ? { ':av': avatar } : {}) },
            }));
            user.googleId = googleId;
            return done(null, user);
          }
        }

        // Create new user
        const userId = crypto.randomUUID();
        const newUser = { userId, googleId, email, name: profile.displayName, avatarUrl: avatar, createdAt: new Date().toISOString() };
        await db.send(new PutCommand({ TableName: TABLE_USERS, Item: newUser }));
        done(null, newUser);
      } catch (err) {
        done(err);
      }
    }
  ));
} else {
  console.warn('GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set — OAuth login disabled');
}

// Serve uploads locally only (production files are on S3)
if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// Health check for Elastic Beanstalk
app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.use('/api/photos/:id/vote', votesRoutes);
app.use('/api/photos', photosRoutes);
app.use('/api/ai', aiRoutes);
app.use('/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`YourBirds backend running at http://localhost:${PORT}`);
});
