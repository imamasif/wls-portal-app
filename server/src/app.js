import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ruleRoutes from './src/features/rules/rule.routes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Sample MongoDB Connection & Server Boot
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/wls_portal';

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Mount under API endpoint
app.use('/api/rules', ruleRoutes);

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB Store');
    app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection error:', err));