import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/wls-portal-db';
    await mongoose.connect(mongoUri);
    console.log(`MongoDB connected successfully locally to: ${mongoUri}`);
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};