// server.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { connectDB } from './src/common/database/db.js';
import userController from './src/features/users/user.controller.js';
import sessionController from './src/features/sessions/session.controller.js';
import wlsSessionRoutes from './src/features/wls-session/index.js'; // <-- Import WLS Session router
import assessmentController from './src/features/wls-assessments/index.js';
import ruleRoutes from './src/features/rules/rule.routes.js';
import { notificationController } from './src/features/notifications/index.js';
import socialController from './src/features/social-groups/social.controller.js'; 
import reportController from './src/features/wls-reporting/index.js';
import { menuPermissionController } from './src/features/menu-permissions/index.js';

// Explicitly import models for the seed endpoint
import { UserModel } from './src/features/users/index.js';
import { SessionModel } from './src/features/sessions/index.js';
import { WlsSessionModel } from './src/features/wls-session/wlsSession.model.js'; // <-- Import WlsSessionModel

const app = express();

app.use(cors());

// 1. SET LIMITS AT THE TOP BEFORE ROUTES ARE MOUNTED
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

connectDB();

app.use('/api/users', userController);
app.use('/api/wls-sessions', wlsSessionRoutes); // <-- Mount WLS Session endpoints here
app.use('/api/sessions', sessionController);
app.use('/api/assessments', assessmentController);
app.use('/api/rules', ruleRoutes);
app.use('/api/notifications', notificationController);
app.use('/api/reports', reportController);
app.use('/api/social-groups', socialController);
app.use('/api/assessments', assessmentController);
app.use('/api/reports', reportController);
app.use('/api/menu-permissions', menuPermissionController);


// 3. Seed Route
app.post('/api/seed', async (req, res) => {
  try {
    await UserModel.deleteMany({});
    await SessionModel.deleteMany({});
    await WlsSessionModel.deleteMany({}); // <-- Clear old WLS sessions

    const rawPassword = 'DefaultPassword123!';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const users = await UserModel.insertMany([
      { 
        name: 'Syed Imam', 
        email: 'syedimam@iipccanada.com', 
        password: hashedPassword, 
        role: 'SUPER_USER', 
        city: 'Toronto', 
        country: 'Canada', 
        drive: 'https://drive.google.com/drive/folders/syed-sa' 
      },
      { 
        name: 'Dr. Tariq Rahman', 
        email: 'tariq.super@iipc.org', 
        password: hashedPassword, 
        role: 'SUPER_USER', 
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
        role: 'USER',
        city: 'Dallas',
        country: 'USA',
        drive: `https://drive.google.com/drive/folders/student-${i + 1}`
      }))
    ]);

    // Seed initial WLS Session
    const initialWlsSession = await WlsSessionModel.create({
      topicName: 'Tafseer & Recitation Module - Week 1',
      sessionDateTimeToronto: new Date(),
      pdfBookletUrl: 'https://example.com/booklet-week1.pdf',
      quranVideoUrl: 'https://youtube.com/watch?v=example',
      status: 'ACTIVE',
      groupAssignments: {
        '1': {
          userIds: [users[3]._id.toString()],
          adminIds: [users[2]._id.toString()],
          selectedAyats: ['Surah Al-Fatiha (1:1-7)'],
          instructions: 'Initial seed instruction for Group 1'
        }
      }
    });

    res.json({ 
      message: 'Database seeded successfully!', 
      usersCount: users.length, 
      wlsSessionCreated: initialWlsSession.topicName 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));