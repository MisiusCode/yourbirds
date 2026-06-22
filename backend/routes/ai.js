import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { requireAuth } from '../middleware/auth.js';
import Photo from '../models/Photo.js';
import { identifySpecies, getCommonNames, enrichBirdData } from '../services/anthropicService.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// POST /api/ai/identify
router.post('/identify', requireAuth, async (req, res) => {
  const { photo_id } = req.body;
  if (!photo_id || !mongoose.Types.ObjectId.isValid(photo_id)) {
    return res.status(400).json({ error: 'Valid photo_id required' });
  }

  const photo = await Photo.findOne({ _id: photo_id, userId: req.session.userId });
  if (!photo) return res.status(404).json({ error: 'Photo not found' });

  const imagePath = path.join(__dirname, '..', 'uploads', 'thumbnails', photo.filenameThumbnail);

  try {
    const latinName = await identifySpecies(imagePath);
    const names = latinName !== 'Unknown' ? await getCommonNames(latinName) : { name_lt: null, name_en: null };
    photo.ai = { latinName, latinApproved: 0, nameLt: names.name_lt, nameEn: names.name_en };
    photo.markModified('ai');
    await photo.save();
    res.json({ latin_name: latinName, name_lt: names.name_lt, name_en: names.name_en });
  } catch (err) {
    console.error('AI identify error:', err.message);
    res.status(500).json({ error: 'Species identification failed' });
  }
});

// POST /api/ai/enrich
router.post('/enrich', requireAuth, async (req, res) => {
  const { photo_id, latin_name } = req.body;
  if (!photo_id || !latin_name || !mongoose.Types.ObjectId.isValid(photo_id)) {
    return res.status(400).json({ error: 'photo_id and latin_name required' });
  }

  const photo = await Photo.findOne({ _id: photo_id, userId: req.session.userId });
  if (!photo) return res.status(404).json({ error: 'Photo not found' });

  try {
    const data = await enrichBirdData(latin_name);
    photo.ai = {
      latinName: photo.ai?.latinName,
      latinApproved: photo.ai?.latinApproved ?? 0,
      nameLt: data.name_lt,
      nameEn: data.name_en,
      facts: data.facts,
      factsLt: data.facts_lt,
    };
    photo.markModified('ai');
    await photo.save();
    res.json(data);
  } catch (err) {
    console.error('AI enrich error:', err.message);
    res.status(500).json({ error: 'Bird data enrichment failed' });
  }
});

export default router;
