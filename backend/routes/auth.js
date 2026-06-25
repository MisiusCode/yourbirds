import express from 'express';
import passport from 'passport';
import bcrypt from 'bcryptjs';
import { db, TABLE_USERS } from '../db/dynamodb.js';
import { GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const router = express.Router();

function sessionUser(user) {
  return {
    id: user.userId,
    name: user.name,
    email: user.email,
    avatar_url: user.avatarUrl || null,
  };
}

async function findByEmail(email) {
  const { Items } = await db.send(new QueryCommand({
    TableName: TABLE_USERS,
    IndexName: 'email-index',
    KeyConditionExpression: 'email = :e',
    ExpressionAttributeValues: { ':e': email.trim().toLowerCase() },
  }));
  return Items?.[0] || null;
}

// ── Email/password register ──────────────────────────────────────────────────

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const existing = await findByEmail(email);
    if (existing) return res.status(409).json({ error: 'Email is already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = crypto.randomUUID();
    const user = {
      userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    await db.send(new PutCommand({ TableName: TABLE_USERS, Item: user }));
    req.session.userId = userId;
    req.session.user = sessionUser(user);
    req.session.save(err => {
      if (err) {
        console.error('Session save error (register):', err);
        return res.status(500).json({ error: 'Registration failed' });
      }
      res.status(201).json({ user: req.session.user });
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ── Email/password login ─────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email?.trim() || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await findByEmail(email);
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  req.session.userId = user.userId;
  req.session.user = sessionUser(user);
  req.session.save(err => {
    if (err) {
      console.error('Session save error (login):', err);
      return res.status(500).json({ error: 'Login failed' });
    }
    res.json({ user: req.session.user });
  });
});

// ── Google OAuth ─────────────────────────────────────────────────────────────

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}?auth=failed` }),
  (req, res) => {
    req.session.userId = req.user.userId;
    req.session.user = sessionUser(req.user);
    req.session.save(() => {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?auth=success`);
    });
  }
);

// ── Session ──────────────────────────────────────────────────────────────────

router.get('/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ user: req.session.user });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

export default router;
