import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { requireAuth } from '../middleware/auth.js';
import { db, TABLE_PHOTOS } from '../db/dynamodb.js';
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { identifySpecies, getCommonNames, enrichBirdData } from '../services/anthropicService.js';
import { downloadFromS3 } from '../services/s3Service.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// POST /api/ai/identify
router.post('/identify', requireAuth, async (req, res) => {
  const { photo_id } = req.body;
  if (!photo_id) return res.status(400).json({ error: 'photo_id required' });

  const { Item: photo } = await db.send(new GetCommand({
    TableName: TABLE_PHOTOS,
    Key: { photoId: photo_id },
  }));
  if (!photo || photo.userId !== req.session.userId) {
    return res.status(404).json({ error: 'Photo not found' });
  }

  try {
    let imageBuffer;
    if (process.env.S3_BUCKET) {
      imageBuffer = await downloadFromS3(`thumbnails/${photo.filenameThumbnail}`);
    } else {
      const localPath = path.join(__dirname, '..', 'uploads', 'thumbnails', photo.filenameThumbnail);
      imageBuffer = fs.readFileSync(localPath);
    }

    const latinName = await identifySpecies(imageBuffer);
    const names = latinName !== 'Unknown' ? await getCommonNames(latinName) : { name_lt: null, name_en: null };

    const ai = { latinName, latinApproved: 0, nameLt: names.name_lt, nameEn: names.name_en };
    await db.send(new UpdateCommand({
      TableName: TABLE_PHOTOS,
      Key: { photoId: photo_id },
      UpdateExpression: 'SET ai = :ai, updatedAt = :upd',
      ExpressionAttributeValues: { ':ai': ai, ':upd': new Date().toISOString() },
    }));

    res.json({ latin_name: latinName, name_lt: names.name_lt, name_en: names.name_en });
  } catch (err) {
    console.error('AI identify error:', err.message);
    res.status(500).json({ error: 'Species identification failed' });
  }
});

// POST /api/ai/enrich
router.post('/enrich', requireAuth, async (req, res) => {
  const { photo_id, latin_name } = req.body;
  if (!photo_id || !latin_name) return res.status(400).json({ error: 'photo_id and latin_name required' });

  const { Item: photo } = await db.send(new GetCommand({
    TableName: TABLE_PHOTOS,
    Key: { photoId: photo_id },
  }));
  if (!photo || photo.userId !== req.session.userId) {
    return res.status(404).json({ error: 'Photo not found' });
  }

  try {
    const data = await enrichBirdData(latin_name);
    const ai = {
      latinName: photo.ai?.latinName,
      latinApproved: photo.ai?.latinApproved ?? 0,
      nameLt: data.name_lt,
      nameEn: data.name_en,
      facts: data.facts,
      factsLt: data.facts_lt,
    };
    await db.send(new UpdateCommand({
      TableName: TABLE_PHOTOS,
      Key: { photoId: photo_id },
      UpdateExpression: 'SET ai = :ai, updatedAt = :upd',
      ExpressionAttributeValues: { ':ai': ai, ':upd': new Date().toISOString() },
    }));
    res.json(data);
  } catch (err) {
    console.error('AI enrich error:', err.message);
    res.status(500).json({ error: 'Bird data enrichment failed' });
  }
});

export default router;
