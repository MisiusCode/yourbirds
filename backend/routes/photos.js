import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import Photo from '../models/Photo.js';
import { extractExif } from '../services/exifService.js';
import { generateThumbnail } from '../services/imageService.js';
import { updateLithuanianName } from '../services/birdNameService.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsBase = path.join(__dirname, '..', 'uploads');

const photoWithStats = [
  {
    $lookup: {
      from: 'votes',
      localField: '_id',
      foreignField: 'photoId',
      as: 'votesData',
    },
  },
  {
    $addFields: {
      avgRating: { $round: [{ $ifNull: [{ $avg: '$votesData.stars' }, 0] }, 1] },
      voteCount: { $size: '$votesData' },
    },
  },
  {
    $lookup: {
      from: 'users',
      localField: 'userId',
      foreignField: '_id',
      as: 'userInfo',
    },
  },
  { $unwind: '$userInfo' },
];

function serialize(p) {
  return {
    id: p._id.toString(),
    user_id: p.userId.toString(),
    filename_original: p.filenameOriginal,
    filename_thumbnail: p.filenameThumbnail,
    title: p.title || null,
    description: p.description || null,
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
    user_name:         p.userInfo?.name || null,
    user_avatar:       p.userInfo?.avatarUrl || null,
    created_at:        p.createdAt,
    updated_at:        p.updatedAt,
  };
}

// GET /api/photos?sort=newest|rating&page=1&limit=20
router.get('/', async (req, res) => {
  const { sort = 'newest', page = 1, limit = 20 } = req.query;
  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
  const sortStage = sort === 'rating'
    ? { $sort: { avgRating: -1, createdAt: -1 } }
    : { $sort: { createdAt: -1 } };

  const photos = await Photo.aggregate([
    ...photoWithStats,
    sortStage,
    { $skip: offset },
    { $limit: parseInt(limit) },
  ]);

  res.json(photos.map(serialize));
});

// GET /api/photos/mine/club250
router.get('/mine/club250', requireAuth, async (req, res) => {
  const uid = new mongoose.Types.ObjectId(req.session.userId);
  const data = await Photo.aggregate([
    {
      $match: {
        userId: uid,
        'ai.latinName': { $exists: true, $nin: [null, '', 'Unknown'] },
      },
    },
    { $addFields: { year: { $year: '$createdAt' } } },
    // one document per (year, species)
    {
      $group: {
        _id: { year: '$year', latinName: '$ai.latinName' },
        nameLt:     { $first: '$ai.nameLt' },
        nameEn:     { $first: '$ai.nameEn' },
        firstSeen:  { $min: '$createdAt' },
        photoCount: { $sum: 1 },
      },
    },
    // roll up per year
    {
      $group: {
        _id: '$_id.year',
        count: { $sum: 1 },
        species: {
          $push: {
            latinName:  '$_id.latinName',
            nameLt:     '$nameLt',
            nameEn:     '$nameEn',
            firstSeen:  '$firstSeen',
            photoCount: '$photoCount',
          },
        },
      },
    },
    { $sort: { _id: -1 } },
  ]);

  res.json(data.map(y => ({
    year: y._id,
    count: y.count,
    species: y.species.sort((a, b) => new Date(a.firstSeen) - new Date(b.firstSeen)),
  })));
});

// GET /api/photos/mine
router.get('/mine', requireAuth, async (req, res) => {
  const photos = await Photo.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(req.session.userId) } },
    ...photoWithStats,
    { $sort: { createdAt: -1 } },
  ]);
  res.json(photos.map(serialize));
});

// GET /api/photos/:id
router.get('/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'Not found' });

  const [photo] = await Photo.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(req.params.id) } },
    ...photoWithStats,
  ]);

  if (!photo) return res.status(404).json({ error: 'Not found' });
  res.json(serialize(photo));
});

// POST /api/photos
router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { title, description } = req.body;

  const [exifData, thumbnailFilename] = await Promise.all([
    extractExif(req.file.path),
    generateThumbnail(req.file.filename),
  ]);

  const photo = await Photo.create({
    userId:            req.session.userId,
    filenameOriginal:  req.file.filename,
    filenameThumbnail: thumbnailFilename,
    title:             title || undefined,
    description:       description || undefined,
    exif: {
      cameraModel: exifData.exif_camera_model || undefined,
      aperture:    exifData.exif_aperture || undefined,
      iso:         exifData.exif_iso || undefined,
      focalLength: exifData.exif_focal_length || undefined,
      takenAt:     exifData.exif_taken_at ? new Date(exifData.exif_taken_at) : undefined,
      gpsLat:      exifData.exif_gps_lat || undefined,
      gpsLng:      exifData.exif_gps_lng || undefined,
    },
  });

  res.status(201).json(serialize({ ...photo.toObject(), avgRating: 0, voteCount: 0, userInfo: null }));
});

// PATCH /api/photos/:id
router.patch('/:id', requireAuth, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'Not found' });

  const photo = await Photo.findById(req.params.id);
  if (!photo) return res.status(404).json({ error: 'Not found' });
  if (photo.userId.toString() !== req.session.userId) return res.status(403).json({ error: 'Forbidden' });

  const { title, description, ai_latin_name, ai_latin_approved, ai_name_lt, ai_name_en } = req.body;
  if (title !== undefined)            photo.title = title;
  if (description !== undefined)      photo.description = description;
  if (ai_latin_name !== undefined || ai_latin_approved !== undefined || ai_name_lt !== undefined || ai_name_en !== undefined) {
    if (!photo.ai) photo.ai = {};
    if (ai_latin_name !== undefined)     photo.ai.latinName = ai_latin_name;
    if (ai_latin_approved !== undefined) photo.ai.latinApproved = ai_latin_approved;
    if (ai_name_lt !== undefined)        photo.ai.nameLt = ai_name_lt;
    if (ai_name_en !== undefined)        photo.ai.nameEn = ai_name_en;
    photo.markModified('ai');

    // Persist Lithuanian name edit back to the species database
    if (ai_name_lt !== undefined && photo.ai.latinName) {
      await updateLithuanianName(photo.ai.latinName, ai_name_lt);
    }
  }
  await photo.save();

  const [updated] = await Photo.aggregate([
    { $match: { _id: photo._id } },
    ...photoWithStats,
  ]);
  res.json(serialize(updated));
});

// DELETE /api/photos/:id
router.delete('/:id', requireAuth, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'Not found' });

  const photo = await Photo.findById(req.params.id);
  if (!photo) return res.status(404).json({ error: 'Not found' });
  if (photo.userId.toString() !== req.session.userId) return res.status(403).json({ error: 'Forbidden' });

  try { fs.unlinkSync(path.join(uploadsBase, 'originals', photo.filenameOriginal)); } catch {}
  try { fs.unlinkSync(path.join(uploadsBase, 'thumbnails', photo.filenameThumbnail)); } catch {}
  await photo.deleteOne();

  res.json({ success: true });
});

export default router;
