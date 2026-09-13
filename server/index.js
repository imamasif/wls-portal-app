require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { google } = require('googleapis');
const stream = require('stream');
const mongoose = require('mongoose');

const app = express();

app.use(cors());
app.use(express.json());

let isMongoConnected = false;

// User Schema for persistence
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  city: String,
  country: String,
  profilePictureUrl: String,
  role: { type: String, default: 'USER' },
  socialMedia: [{ platform: String, handleUrl: String }]
}, { timestamps: true });

// Explicit subdocument schema for Groups to prevent strict Mongoose casting issues
const groupSchema = new mongoose.Schema({
  groupName: { type: String, default: 'Group' },
  sequenceOfAyat: { type: String, default: '' },
  assignedUserIds: [{ type: String }]
}, { _id: false });

// Session Schema for persistence
const sessionSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Session Title is required'] },
  dateTime: { type: String, required: [true, 'Session Date & Time is required'] },
  videoClipUrl: { type: String, default: '' },
  pdfResourceUrl: { type: String, default: '' },
  groups: [groupSchema]
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Session = mongoose.model('Session', sessionSchema);

let memoryUsers = [
  { 
    id: '1', 
    name: 'Syed Imam', 
    email: 'syed.imam@iipc.org', 
    password: 'password123',
    role: 'SUPER_ADMIN', 
    city: 'Lincoln', 
    country: 'Canada', 
    profilePictureUrl: 'https://ui-avatars.com/api/?name=Syed+Imam&background=0284c7&color=fff', 
    socialMedia: [{ platform: 'YouTube', handleUrl: '@iipc_official' }] 
  }
];

let memorySessions = [
  {
    id: '101',
    title: 'WLS Session 1 - Al-Baqarah Study',
    dateTime: '2026-09-15T18:00',
    videoClipUrl: 'https://youtube.com/watch?v=example',
    pdfResourceUrl: 'https://example.com/notes.pdf',
    groups: [
      { groupName: 'Group 1', sequenceOfAyat: 'Ch 2 (1-10)', assignedUserIds: ['1'] }
    ]
  }
];

let drive = null;
try {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'google-credentials.json',
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
  drive = google.drive({ version: 'v3', auth });
} catch (err) {
  console.log('Google Drive credentials file missing. Dynamic avatar fallback active.');
}

const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } });

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', mongoConnected: isMongoConnected, timestamp: new Date().toISOString() });
});

// GET /api/users - Fetch All Users
app.get('/api/users', async (req, res) => {
  try {
    if (isMongoConnected) {
      const users = await User.find();
      const mapped = users.map(u => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        city: u.city,
        country: u.country,
        profilePictureUrl: u.profilePictureUrl,
        role: u.role,
        socialMedia: u.socialMedia
      }));
      return res.json(mapped);
    }
    res.json(memoryUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users - User Registration
app.post('/api/users', async (req, res) => {
  try {
    const { name, email, password, city, country, profilePictureUrl, role, socialMedia } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Validation Error: Name, Email, and Password are required.' });
    }

    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0284c7&color=fff`;
    const avatarUrl = profilePictureUrl && profilePictureUrl.trim() !== '' ? profilePictureUrl : defaultAvatar;

    if (isMongoConnected) {
      const newUser = new User({
        name,
        email,
        password,
        city: city || '',
        country: country || '',
        profilePictureUrl: avatarUrl,
        role: role || 'USER',
        socialMedia: Array.isArray(socialMedia) ? socialMedia : []
      });
      await newUser.save();
      return res.status(201).json({ message: 'User registered successfully', user: newUser });
    }

    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password,
      city: city || '',
      country: country || '',
      profilePictureUrl: avatarUrl,
      role: role || 'USER',
      socialMedia: Array.isArray(socialMedia) ? socialMedia : []
    };
    memoryUsers.push(newUser);
    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

// PATCH /api/users/:id/role - Update User Role
app.patch('/api/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ error: 'Role is required.' });
    }

    if (isMongoConnected) {
      const updated = await User.findByIdAndUpdate(id, { role }, { new: true });
      if (!updated) return res.status(404).json({ error: 'User not found' });
      return res.json({ message: 'Role updated successfully', user: updated });
    }

    const user = memoryUsers.find(u => u.id === id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.role = role;
    res.json({ message: 'Role updated successfully', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/upload-profile-picture - Google Drive / Avatar File Handler
app.post('/api/upload-profile-picture', upload.single('photo'), async (req, res) => {
  try {
    const fullName = req.body.fullName || 'User';
    const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0284c7&color=fff`;

    if (!req.file) {
      return res.json({ profilePictureUrl: fallbackUrl });
    }

    if (drive && process.env.GOOGLE_DRIVE_FOLDER_ID) {
      const bufferStream = new stream.PassThrough();
      bufferStream.end(req.file.buffer);

      const driveRes = await drive.files.create({
        requestBody: {
          name: `${fullName.replace(/[^a-zA-Z0-9]/g, '_')}_Profile.jpg`,
          parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
        },
        media: { mimeType: req.file.mimetype, body: bufferStream },
        fields: 'id, webViewLink, webContentLink',
      });

      return res.json({
        message: 'Uploaded to Google Drive',
        profilePictureUrl: driveRes.data.webViewLink || driveRes.data.webContentLink || fallbackUrl,
      });
    }

    res.json({ profilePictureUrl: fallbackUrl });
  } catch (err) {
    console.warn('Profile upload exception, returning avatar:', err.message);
    const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(req.body.fullName || 'User')}&background=0284c7&color=fff`;
    res.json({ profilePictureUrl: fallbackUrl });
  }
});

// GET /api/sessions - Fetch All WLS Sessions
app.get('/api/sessions', async (req, res) => {
  try {
    if (isMongoConnected) {
      const sessions = await Session.find();
      const mapped = sessions.map(s => ({
        id: s._id.toString(),
        title: s.title,
        dateTime: s.dateTime,
        videoClipUrl: s.videoClipUrl,
        pdfResourceUrl: s.pdfResourceUrl,
        groups: s.groups
      }));
      return res.json(mapped);
    }
    res.json(memorySessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sessions - Create & Save WLS Session
app.post('/api/sessions', async (req, res) => {
  try {
    console.log('Received POST /api/sessions body:', JSON.stringify(req.body, null, 2));
    const { title, dateTime, videoClipUrl, pdfResourceUrl, groups } = req.body || {};

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ 
        error: 'Validation Error: Session Title is required.' 
      });
    }

    if (!dateTime || typeof dateTime !== 'string' || !dateTime.trim()) {
      return res.status(400).json({ 
        error: 'Validation Error: Date & Time is required.' 
      });
    }

    // Sanitize nested groups and assigned user IDs to match schema
    const sanitizedGroups = Array.isArray(groups) ? groups.map(g => ({
      groupName: String(g.groupName || 'Group'),
      sequenceOfAyat: String(g.sequenceOfAyat || ''),
      assignedUserIds: Array.isArray(g.assignedUserIds) ? g.assignedUserIds.map(id => String(id)) : []
    })) : [];

    if (isMongoConnected) {
      const newSession = new Session({
        title: title.trim(),
        dateTime: dateTime.trim(),
        videoClipUrl: videoClipUrl || '',
        pdfResourceUrl: pdfResourceUrl || '',
        groups: sanitizedGroups
      });
      const saved = await newSession.save();
      const mapped = {
        id: saved._id.toString(),
        title: saved.title,
        dateTime: saved.dateTime,
        videoClipUrl: saved.videoClipUrl,
        pdfResourceUrl: saved.pdfResourceUrl,
        groups: saved.groups
      };
      return res.status(201).json({ 
        message: 'WLS Session saved successfully to MongoDB', 
        session: mapped 
      });
    }

    const newSession = {
      id: Date.now().toString(),
      title: title.trim(),
      dateTime: dateTime.trim(),
      videoClipUrl: videoClipUrl || '',
      pdfResourceUrl: pdfResourceUrl || '',
      groups: sanitizedGroups,
      createdAt: new Date().toISOString()
    };

    memorySessions.push(newSession);
    return res.status(201).json({ 
      message: 'WLS Session saved successfully', 
      session: newSession 
    });
  } catch (err) {
    console.error('Session Save Error details:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation Error: ' + err.message });
    }
    return res.status(500).json({ error: 'Database/Server Error: ' + err.message });
  }
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/iipc_learning_portal';

mongoose.connect(MONGO_URI)
  .then(() => {
    isMongoConnected = true;
    console.log('✅ Connected to MongoDB Database');
  })
  .catch(() => {
    console.warn('⚠️ MongoDB connection unavailable. Active in-memory fallback mode.');
  })
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Express server running on http://localhost:${PORT}`);
    });
  });