import mongoose from 'mongoose';

export async function connectDb() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/yourbirds';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB at', uri);
}
