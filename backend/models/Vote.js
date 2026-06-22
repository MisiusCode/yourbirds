import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema({
  photoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Photo', required: true },
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
  stars:   { type: Number, required: true, min: 1, max: 5 },
}, { timestamps: true });

voteSchema.index({ photoId: 1, userId: 1 }, { unique: true });
voteSchema.index({ photoId: 1 });

export default mongoose.model('Vote', voteSchema);
