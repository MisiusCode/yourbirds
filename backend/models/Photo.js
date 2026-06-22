import mongoose from 'mongoose';

const photoSchema = new mongoose.Schema({
  userId:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filenameOriginal:  { type: String, required: true },
  filenameThumbnail: { type: String, required: true },
  title:             String,
  description:       String,
  exif: {
    cameraModel: String,
    aperture:    String,
    iso:         Number,
    focalLength: String,
    takenAt:     Date,
    gpsLat:      Number,
    gpsLng:      Number,
  },
  ai: {
    latinName:     String,
    latinApproved: { type: Number, default: 0 }, // 0=pending, 1=approved, 2=user-edited
    nameLt:        String,
    nameEn:        String,
    facts:         [String],
    factsLt:       [String],
  },
}, { timestamps: true });

photoSchema.index({ userId: 1 });
photoSchema.index({ createdAt: -1 });

export default mongoose.model('Photo', photoSchema);
