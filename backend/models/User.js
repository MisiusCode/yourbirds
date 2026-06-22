import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  googleId:     { type: String, unique: true, sparse: true }, // optional — email accounts won't have this
  email:        { type: String, required: true, unique: true },
  name:         { type: String, required: true },
  avatarUrl:    String,
  passwordHash: { type: String, select: false }, // never returned in queries unless explicitly selected
}, { timestamps: true });

export default mongoose.model('User', userSchema);
