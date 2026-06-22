import mongoose from 'mongoose';

const birdNameSchema = new mongoose.Schema({
  latinName: { type: String, required: true, unique: true, lowercase: true, trim: true },
  nameLt:    { type: String, required: true },
}, { timestamps: true });

export default mongoose.model('BirdName', birdNameSchema);
