import express from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/auth.js';
import Photo from '../models/Photo.js';
import Vote from '../models/Vote.js';

const router = express.Router({ mergeParams: true });

// GET /api/photos/:id/vote
router.get('/', requireAuth, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.json({ stars: null });
  const vote = await Vote.findOne({ photoId: req.params.id, userId: req.session.userId });
  res.json({ stars: vote ? vote.stars : null });
});

// POST /api/photos/:id/vote
router.post('/', requireAuth, async (req, res) => {
  const stars = parseInt(req.body.stars);
  if (!stars || stars < 1 || stars > 5) return res.status(400).json({ error: 'Stars must be 1–5' });
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'Photo not found' });

  const photo = await Photo.findById(req.params.id, 'userId');
  if (!photo) return res.status(404).json({ error: 'Photo not found' });
  if (photo.userId.toString() === req.session.userId) {
    return res.status(403).json({ error: 'Cannot vote on your own photo' });
  }

  await Vote.findOneAndUpdate(
    { photoId: req.params.id, userId: req.session.userId },
    { stars },
    { upsert: true, new: true }
  );

  const [stats] = await Vote.aggregate([
    { $match: { photoId: new mongoose.Types.ObjectId(req.params.id) } },
    { $group: { _id: null, avg_rating: { $avg: '$stars' }, vote_count: { $sum: 1 } } },
  ]);

  res.json({
    success: true,
    stars,
    avg_rating: stats ? Math.round(stats.avg_rating * 10) / 10 : stars,
    vote_count: stats ? stats.vote_count : 1,
  });
});

// DELETE /api/photos/:id/vote
router.delete('/', requireAuth, async (req, res) => {
  await Vote.deleteOne({ photoId: req.params.id, userId: req.session.userId });
  res.json({ success: true });
});

export default router;
