import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { db, TABLE_VOTES, TABLE_PHOTOS } from '../db/dynamodb.js';
import { GetCommand, PutCommand, DeleteCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const router = express.Router({ mergeParams: true });

async function recalcRating(photoId) {
  const { Items = [] } = await db.send(new QueryCommand({
    TableName: TABLE_VOTES,
    KeyConditionExpression: 'photoId = :pid',
    ExpressionAttributeValues: { ':pid': photoId },
  }));
  const voteCount = Items.length;
  const avgRating = voteCount
    ? Math.round(Items.reduce((s, v) => s + v.stars, 0) / voteCount * 10) / 10
    : 0;
  await db.send(new UpdateCommand({
    TableName: TABLE_PHOTOS,
    Key: { photoId },
    UpdateExpression: 'SET avgRating = :r, voteCount = :c',
    ExpressionAttributeValues: { ':r': avgRating, ':c': voteCount },
  }));
  return { avg_rating: avgRating, vote_count: voteCount };
}

// GET /api/photos/:id/vote
router.get('/', requireAuth, async (req, res) => {
  const { Item } = await db.send(new GetCommand({
    TableName: TABLE_VOTES,
    Key: { photoId: req.params.id, userId: req.session.userId },
  }));
  res.json({ stars: Item?.stars ?? null });
});

// POST /api/photos/:id/vote
router.post('/', requireAuth, async (req, res) => {
  const stars = parseInt(req.body.stars);
  if (!stars || stars < 1 || stars > 5) return res.status(400).json({ error: 'Stars must be 1–5' });

  const { Item: photo } = await db.send(new GetCommand({
    TableName: TABLE_PHOTOS,
    Key: { photoId: req.params.id },
  }));
  if (!photo) return res.status(404).json({ error: 'Photo not found' });
  if (photo.userId === req.session.userId) {
    return res.status(403).json({ error: 'Cannot vote on your own photo' });
  }

  await db.send(new PutCommand({
    TableName: TABLE_VOTES,
    Item: { photoId: req.params.id, userId: req.session.userId, stars, createdAt: new Date().toISOString() },
  }));

  const stats = await recalcRating(req.params.id);
  res.json({ success: true, stars, ...stats });
});

// DELETE /api/photos/:id/vote
router.delete('/', requireAuth, async (req, res) => {
  await db.send(new DeleteCommand({
    TableName: TABLE_VOTES,
    Key: { photoId: req.params.id, userId: req.session.userId },
  }));
  await recalcRating(req.params.id);
  res.json({ success: true });
});

export default router;
