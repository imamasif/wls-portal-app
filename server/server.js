import express from 'express';
import cors from 'cors';
import { connectDB } from './src/common/database/db.js';
import userController from './src/features/users/user.controller.js';
import sessionController from './src/features/sessions/session.controller.js';
import { UserModel } from './src/features/users/data/user.model.js';
import { SessionModel } from './src/features/sessions/data/session.model.js';

const app = express();

app.use(cors());
app.use(express.json());

// Connect Database
connectDB();

// Feature Routes
app.use('/api/users', userController);
app.use('/api/sessions', sessionController);

// Seed Route
app.post('/api/seed', async (req, res) => {
  try {
    await UserModel.deleteMany({});
    await SessionModel.deleteMany({});

    const users = await UserModel.insertMany([
      { name: 'Syed Imam', email: 'syed.super@iipc.org', role: 'SUPER_ADMIN', city: 'Toronto', country: 'Canada', drive: 'https://drive.google.com/drive/folders/syed-sa' },
      { name: 'Dr. Tariq Rahman', email: 'tariq.super@iipc.org', role: 'SUPER_ADMIN', city: 'London', country: 'UK', drive: 'https://drive.google.com/drive/folders/tariq-sa' },
      { name: 'Sheikh Ahmed Khan', email: 'ahmed.admin@iipc.org', role: 'WLS_ADMIN', city: 'Chicago', country: 'USA' },
      ...Array.from({ length: 20 }, (_, i) => ({
        name: `Student ${i + 1}`,
        email: `student${i + 1}@iipc.org`,
        role: 'USER',
        city: 'Dallas',
        country: 'USA',
        drive: `https://drive.google.com/drive/folders/student-${i + 1}`
      }))
    ]);

    const session = await SessionModel.create({
      week: 36,
      topicTitle: 'Week 36: Foundations of Faith & Reflection',
      verseSequences: [
        { order: 1, text: 'Chapter 5 : Verse 2 (Part A - Introduction)' },
        { order: 2, text: 'Chapter 7 : Verses 27-29 (Part B - Recitation)' },
        { order: 3, text: 'Chapter 57 : Verses 97-98 (Part C - Conclusion)' }
      ]
    });

    res.json({ message: 'Database seeded successfully!', usersCount: users.length, sessionCreated: session.week });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));