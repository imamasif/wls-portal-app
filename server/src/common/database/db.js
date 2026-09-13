import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/iipc_learning_portal');
    console.log('MongoDB connected successfully locally.');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};