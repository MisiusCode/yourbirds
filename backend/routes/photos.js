import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { db, TABLE_PHOTOS } from '../db/dynamodb.js';
import {
  GetCommand, PutCommand, UpdateCommand, DeleteCommand,
  QueryCommand, ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { extractExif } from '../services/exifService.js';
import { generateThumbnail } from '../services/imageService.js';
import { updateLithuanianName } from '../services/birdNameService.js';
import { uploadFileToS3, deleteFromS3 } from '../services/s3Service.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsBase = path.join(__dirname, '..', 'uploads');

function serialize(p) {
  return {
    id:                p.photoId,
    user_id:           p.userId,
    filename_original: p.filenameOriginal,
    filename_thumbnail: p.filenameThumbnail,
    title:             p.title || null,
    description:       p.description || null,
    exif_camera_model: p.exif?.cameraModel || null,
    exif_aperture:     p.exif?.aperture || null,
    exif_iso:          p.exif?.iso || null,
    exif_focal_length: p.exif?.focalLength || null,
    exif_taken_at:     p.exif?.takenAt ? new Date(p.exif.takenAt).toISOString() : null,
    exif_gps_lat:      p.exif?.gpsLat || null,
    exif_gps_lng:      p.exif?.gpsLng || null,
    ai_latin_name:     p.ai?.latinName || null,
    ai_latin_approved: p.ai?.latinApproved ?? 0,
    ai_name_lt:        p.ai?.nameLt || null,
    ai_name_en:        p.ai?.nameEn || null,
    ai_facts:          p.ai?.facts?.length ? p.ai.facts : null,
    ai_facts_lt:       p.ai?.factsLt?.length ? p.ai.factsLt : null,
    avg_rating:        p.avgRating ?? 0,
    vote_count:        p.voteCount ?? 0,
    user_name:         p.userName || null,
    user_avatar:       p.userAvatar || null,
    created_at:        p.createdAt,
    updated_at:        p.updatedAt,
    group_id:          p.groupId || null,
    group_index:       p.groupIndex ?? 0,
    group_siblings:    p.groupSiblings?.length
      ? p.groupSiblings.map(s => ({
          id: s.id,
          filename_thumbnail: s.filenameThumbnail,
          filename_original:  s.filenameOriginal,
          group_index:        s.groupIndex,
        }))
      : null,
  };
}

// GET /api/photos?sort=newest|rating&page=1&limit=20
router.get('/', async (req, res) => {
  const { sort = 'newest', page = 1, limit = 20 } = req.query;
  const limitNum = parseInt(limit);

  if (sort === 'rating') {
    // Scan all primary photos, sort by rating in JS
    const { Items = [] } = await db.send(new ScanCommand({
      TableName: TABLE_PHOTOS,
      FilterExpression: 'gsiPk = :all',
      ExpressionAttributeValues: { ':all': 'ALL' },
    }));
    const sorted = Items.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
    return res.json(sorted.slice(0, limitNum).map(serialize));
  }

  // sort=newest: query gallery-index GSI
  const { Items = [] } = await db.send(new QueryCommand({
    TableName: TABLE_PHOTOS,
    IndexName: 'gallery-index',
    KeyConditionExpression: 'gsiPk = :all',
    ExpressionAttributeValues: { ':all': 'ALL' },
    ScanIndexForward: false,
    Limit: limitNum,
  }));

  res.json(Items.map(serialize));
});

// GET /api/photos/mine/club250
router.get('/mine/club250', requireAuth, async (req, res) => {
  const { Items = [] } = await db.send(new QueryCommand({
    TableName: TABLE_PHOTOS,
    IndexName: 'user-index',
    KeyConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: { ':uid': req.session.userId },
  }));

  const withSpecies = Items.filter(p => p.ai?.latinName && p.ai.latinName !== 'Unknown');

  const byYear = {};
  for (const photo of withSpecies) {
    const year = new Date(photo.createdAt).getFullYear();
    if (!byYear[year]) byYear[year] = {};
    const key = photo.ai.latinName.toLowerCase();
    if (!byYear[year][key]) {
      byYear[year][key] = {
        latinName: photo.ai.latinName,
        nameLt: photo.ai.nameLt || null,
        nameEn: photo.ai.nameEn || null,
        firstSeen: photo.createdAt,
        photoCount: 0,
      };
    }
    byYear[year][key].photoCount++;
    if (photo.createdAt < byYear[year][key].firstSeen) {
      byYear[year][key].firstSeen = photo.createdAt;
    }
  }

  const result = Object.entries(byYear)
    .sort(([a], [b]) => b - a)
    .map(([year, speciesMap]) => ({
      year: parseInt(year),
      count: Object.keys(speciesMap).length,
      species: Object.values(speciesMap).sort((a, b) => new Date(a.firstSeen) - new Date(b.firstSeen)),
    }));

  res.json(result);
});

// GET /api/photos/mine
router.get('/mine', requireAuth, async (req, res) => {
  const { Items = [] } = await db.send(new QueryCommand({
    TableName: TABLE_PHOTOS,
    IndexName: 'user-index',
    KeyConditionExpression: 'userId = :uid',
    FilterExpression: 'gsiPk = :all',
    ExpressionAttributeValues: { ':uid': req.session.userId, ':all': 'ALL' },
    ScanIndexForward: false,
  }));
  res.json(Items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(serialize));
});

// GET /api/photos/:id
router.get('/:id', async (req, res) => {
  const { Item: photo } = await db.send(new GetCommand({
    TableName: TABLE_PHOTOS,
    Key: { photoId: req.params.id },
  }));
  if (!photo) return res.status(404).json({ error: 'Not found' });

  // For secondary photos, fetch siblings dynamically from GSI
  if (photo.groupId && (photo.groupIndex ?? 0) !== 0) {
    const { Items: groupPhotos = [] } = await db.send(new QueryCommand({
      TableName: TABLE_PHOTOS,
      IndexName: 'group-index',
      KeyConditionExpression: 'groupId = :gid',
      ExpressionAttributeValues: { ':gid': photo.groupId },
    }));
    photo.groupSiblings = groupPhotos
      .filter(p => p.photoId !== photo.photoId)
      .map(p => ({ id: p.photoId, filenameThumbnail: p.filenameThumbnail, filenameOriginal: p.filenameOriginal, groupIndex: p.groupIndex ?? 0 }));
  }

  res.json(serialize(photo));
});

// POST /api/photos  (accepts 1–10 files as `files[]`)
router.post('/', requireAuth, upload.array('files', 10), async (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: 'No files uploaded' });
  const { title, description } = req.body;
  const groupId = req.files.length > 1 ? crypto.randomUUID() : null;
  const now = new Date().toISOString();
  const userName = req.session.user?.name || '';
  const userAvatar = req.session.user?.avatar_url || null;

  const siblings = [];

  await Promise.all(req.files.map(async (file, index) => {
    const photoId = crypto.randomUUID();
    const isPrimary = index === 0;

    const [exifData, thumbnailFilename] = await Promise.all([
      extractExif(file.path),
      generateThumbnail(file.filename),
    ]);

    if (process.env.S3_BUCKET) {
      const thumbPath = path.join(uploadsBase, 'thumbnails', thumbnailFilename);
      await Promise.all([
        uploadFileToS3(file.path, `originals/${file.filename}`, file.mimetype),
        uploadFileToS3(thumbPath, `thumbnails/${thumbnailFilename}`, 'image/jpeg'),
      ]);
      try { fs.unlinkSync(file.path); } catch {}
      try { fs.unlinkSync(thumbPath); } catch {}
    }

    siblings.push({ id: photoId, filenameThumbnail: thumbnailFilename, filenameOriginal: file.filename, groupIndex: index });

    await db.send(new PutCommand({
      TableName: TABLE_PHOTOS,
      Item: {
        photoId,
        // Only primary photos appear in the gallery-index GSI
        gsiPk: isPrimary ? 'ALL' : undefined,
        gsiSk: isPrimary ? `${now}#${photoId}` : undefined,
        userId: req.session.userId,
        userName,
        userAvatar,
        filenameOriginal: file.filename,
        filenameThumbnail: thumbnailFilename,
        title: isPrimary ? (title || undefined) : undefined,
        description: isPrimary ? (description || undefined) : undefined,
        groupId: groupId || undefined,
        groupIndex: index,
        groupSiblings: isPrimary ? [] : undefined,
        avgRating: 0,
        voteCount: 0,
        createdAt: now,
        updatedAt: now,
        exif: {
          cameraModel: exifData.exif_camera_model || undefined,
          aperture:    exifData.exif_aperture || undefined,
          iso:         exifData.exif_iso || undefined,
          focalLength: exifData.exif_focal_length || undefined,
          takenAt:     exifData.exif_taken_at || undefined,
          gpsLat:      exifData.exif_gps_lat || undefined,
          gpsLng:      exifData.exif_gps_lng || undefined,
        },
      },
    }));
  }));

  // Update primary photo's groupSiblings once all are created
  if (groupId) {
    const groupSiblings = siblings.filter(s => s.groupIndex !== 0);
    await db.send(new UpdateCommand({
      TableName: TABLE_PHOTOS,
      Key: { photoId: siblings[0].id },
      UpdateExpression: 'SET groupSiblings = :siblings',
      ExpressionAttributeValues: { ':siblings': groupSiblings },
    }));
  }

  // Return the primary photo
  const { Item: primary } = await db.send(new GetCommand({
    TableName: TABLE_PHOTOS,
    Key: { photoId: siblings[0].id },
  }));
  res.status(201).json(serialize(primary));
});

// PATCH /api/photos/:id
router.patch('/:id', requireAuth, async (req, res) => {
  const { Item: photo } = await db.send(new GetCommand({
    TableName: TABLE_PHOTOS,
    Key: { photoId: req.params.id },
  }));
  if (!photo) return res.status(404).json({ error: 'Not found' });
  if (photo.userId !== req.session.userId) return res.status(403).json({ error: 'Forbidden' });

  const { title, description, ai_latin_name, ai_latin_approved, ai_name_lt, ai_name_en } = req.body;

  const updates = [];
  const vals = {};

  if (title !== undefined)       { updates.push('title = :title');       vals[':title'] = title; }
  if (description !== undefined) { updates.push('description = :desc');  vals[':desc'] = description; }

  if (ai_latin_name !== undefined || ai_latin_approved !== undefined || ai_name_lt !== undefined || ai_name_en !== undefined) {
    const ai = photo.ai || {};
    if (ai_latin_name !== undefined)     ai.latinName    = ai_latin_name;
    if (ai_latin_approved !== undefined) ai.latinApproved = ai_latin_approved;
    if (ai_name_lt !== undefined)        ai.nameLt       = ai_name_lt;
    if (ai_name_en !== undefined)        ai.nameEn       = ai_name_en;
    updates.push('ai = :ai');
    vals[':ai'] = ai;

    if (ai_name_lt !== undefined && ai.latinName) {
      await updateLithuanianName(ai.latinName, ai_name_lt);
    }
  }

  updates.push('updatedAt = :upd');
  vals[':upd'] = new Date().toISOString();

  await db.send(new UpdateCommand({
    TableName: TABLE_PHOTOS,
    Key: { photoId: req.params.id },
    UpdateExpression: 'SET ' + updates.join(', '),
    ExpressionAttributeValues: vals,
  }));

  const { Item: updated } = await db.send(new GetCommand({
    TableName: TABLE_PHOTOS,
    Key: { photoId: req.params.id },
  }));
  res.json(serialize(updated));
});

// DELETE /api/photos/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const { Item: photo } = await db.send(new GetCommand({
    TableName: TABLE_PHOTOS,
    Key: { photoId: req.params.id },
  }));
  if (!photo) return res.status(404).json({ error: 'Not found' });
  if (photo.userId !== req.session.userId) return res.status(403).json({ error: 'Forbidden' });

  // Remove files
  if (process.env.S3_BUCKET) {
    await deleteFromS3(`originals/${photo.filenameOriginal}`, `thumbnails/${photo.filenameThumbnail}`);
  } else {
    try { fs.unlinkSync(path.join(uploadsBase, 'originals', photo.filenameOriginal)); } catch {}
    try { fs.unlinkSync(path.join(uploadsBase, 'thumbnails', photo.filenameThumbnail)); } catch {}
  }

  // If this is a sibling, remove it from the primary photo's groupSiblings list
  if (photo.groupId && (photo.groupIndex ?? 0) !== 0) {
    const { Items: groupPhotos = [] } = await db.send(new QueryCommand({
      TableName: TABLE_PHOTOS,
      IndexName: 'group-index',
      KeyConditionExpression: 'groupId = :gid AND groupIndex = :zero',
      ExpressionAttributeValues: { ':gid': photo.groupId, ':zero': 0 },
    }));
    const primary = groupPhotos[0];
    if (primary) {
      const updatedSiblings = (primary.groupSiblings || []).filter(s => s.id !== req.params.id);
      await db.send(new UpdateCommand({
        TableName: TABLE_PHOTOS,
        Key: { photoId: primary.photoId },
        UpdateExpression: 'SET groupSiblings = :siblings',
        ExpressionAttributeValues: { ':siblings': updatedSiblings },
      }));
    }
  }

  await db.send(new DeleteCommand({
    TableName: TABLE_PHOTOS,
    Key: { photoId: req.params.id },
  }));

  res.json({ success: true });
});

export default router;
