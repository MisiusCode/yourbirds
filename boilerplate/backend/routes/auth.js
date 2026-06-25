/**
 * Auth route pattern: always call req.session.save(cb) before responding.
 *
 * With saveUninitialized: false, express-session's auto-save doesn't fire
 * for new sessions. Without an explicit save(), Set-Cookie is never sent on
 * the first login response.
 */
import express from 'express';
import bcrypt from 'bcryptjs';
import { QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { db } from '../db/dynamodb.js';

const router = express.Router();
const TABLE_USERS = 'myapp-users';

// Helper — only store what you need in the session (not the full user object)
function sessionUser(user) {
  return { userId: user.userId, name: user.name, email: user.email };
}

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

  // Check if email already exists
  const { Items } = await db.send(new QueryCommand({
    TableName: TABLE_USERS,
    IndexName: 'email-index',
    KeyConditionExpression: 'email = :e',
    ExpressionAttributeValues: { ':e': email },
  }));
  if (Items?.length) return res.status(409).json({ error: 'Email already registered' });

  const userId = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);
  const user = { userId, name, email, passwordHash, createdAt: new Date().toISOString() };
  await db.send(new PutCommand({ TableName: TABLE_USERS, Item: user }));

  req.session.userId = userId;
  req.session.user = sessionUser(user);

  // Explicit save required — with saveUninitialized:false, auto-save won't fire
  req.session.save(err => {
    if (err) return res.status(500).json({ error: 'Registration failed' });
    res.status(201).json({ user: req.session.user });
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

  const { Items } = await db.send(new QueryCommand({
    TableName: TABLE_USERS,
    IndexName: 'email-index',
    KeyConditionExpression: 'email = :e',
    ExpressionAttributeValues: { ':e': email },
  }));
  const user = Items?.[0];
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  req.session.userId = user.userId;
  req.session.user = sessionUser(user);

  req.session.save(err => {
    if (err) return res.status(500).json({ error: 'Login failed' });
    res.json({ user: req.session.user });
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ user: req.session.user });
});

export default router;
