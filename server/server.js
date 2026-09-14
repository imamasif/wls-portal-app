// server.js
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { connectDB } from './src/common/database/db.js';
import userController from './src/features/users/user.controller.js';
import sessionController from './src/features/sessions/session.controller.js';
import assessmentController from './src/features/assessments/assessment.controller.js';

// Explicitly import models for the seed endpoint
import { UserModel } from './src/features/users/index.js';
import { SessionModel } from './src/features/sessions/index.js';

const app = express();

app.use(cors());

// 1. SET LIMITS AT THE TOP BEFORE ROUTES ARE MOUNTED
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

connectDB();

app.use('/api/users', userController);
app.use('/api/sessions', sessionController);
// Mount Route alongside users and sessions
app.use('/api/assessments', assessmentController);

// Seed Route
app.post('/api/seed', async (req, res) => {
  try {
    await UserModel.deleteMany({});
    await SessionModel.deleteMany({});

    const rawPassword = 'DefaultPassword123!';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const users = await UserModel.insertMany([
      { 
        name: 'Syed Imam', 
        email: 'syed.imam@iipc.org', // Updated email to match your login
        password: hashedPassword, // Stored as bcrypt hash
        role: 'SUPER_ADMIN', 
        city: 'Toronto', 
        country: 'Canada', 
        drive: 'https://drive.google.com/drive/folders/syed-sa' 
      },
      { 
        name: 'Dr. Tariq Rahman', 
        email: 'tariq.super@iipc.org', 
        password: hashedPassword, 
        role: 'SUPER_ADMIN', 
        city: 'London', 
        country: 'UK', 
        drive: 'https://drive.google.com/drive/folders/tariq-sa' 
      },
      { 
        name: 'Sheikh Ahmed Khan', 
        email: 'ahmed.admin@iipc.org', 
        password: hashedPassword, 
        role: 'WLS_ADMIN', 
        city: 'Chicago', 
        country: 'USA' 
      },
      ...Array.from({ length: 20 }, (_, i) => ({
        name: `Student ${i + 1}`,
        email: `student${i + 1}@iipc.org`,
        password: hashedPassword,
        role: 'STUDENT',
        city: 'Dallas',
        country: 'USA',
        drive: `https://drive.google.com/drive/folders/student-${i + 1}`
      }))
    ]);

    const session = await SessionModel.create({
      weekNumber: 36,
      title: 'Week 36: Foundations of Faith & Reflection',
      groups: []
    });

    res.json({ message: 'Database seeded successfully!', usersCount: users.length, sessionCreated: session.weekNumber });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));