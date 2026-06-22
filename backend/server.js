import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
dotenvConfig({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

import express from 'express';
import cors from 'cors';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import path from 'path';
import fs from 'fs';
import { connectDb } from './db/mongoose.js';
import User from './models/User.js';
import { seedBirdNames } from './services/birdNameService.js';
import authRoutes from './routes/auth.js';
import photosRoutes from './routes/photos.js';
import votesRoutes from './routes/votes.js';
import aiRoutes from './routes/ai.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

for (const dir of ['uploads/originals', 'uploads/thumbnails']) {
  fs.mkdirSync(path.join(__dirname, dir), { recursive: true });
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yourbirds';

await connectDb();
await seedBirdNames();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.use(session({
  store: MongoStore.create({ mongoUrl: MONGODB_URI }),
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
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

        // Try by Google ID first, then merge by email if an existing account matches
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = await User.findOne({ email });
          if (user) {
            user.googleId = profile.id;
            if (!user.avatarUrl) user.avatarUrl = avatar;
            await user.save();
          } else {
            user = await User.create({ googleId: profile.id, email, name: profile.displayName, avatarUrl: avatar });
          }
        }
        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  ));
} else {
  console.warn('GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set — OAuth login disabled');
}

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/photos/:id/vote', votesRoutes);
app.use('/api/photos', photosRoutes);
app.use('/api/ai', aiRoutes);
app.use('/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`YourBirds backend running at http://localhost:${PORT}`);
});
