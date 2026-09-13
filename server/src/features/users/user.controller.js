import express from 'express';
import mongoose from 'mongoose';
import { google } from 'googleapis';
import stream from 'stream';
import { userUseCase, UserMapper, UserModel } from './index.js';

const router = express.Router();

// Initialize Google Drive API client using environment variables
const drive = google.drive({
  version: 'v3',
  auth: process.env.GOOGLE_API_KEY,
});

// Helper to stream image buffer to central Google Drive folder
const uploadBufferToDrive = (buffer, fileName, mimeType) => {
  return new Promise((resolve, reject) => {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);

    drive.files.create(
      {
        requestBody: {
          name: fileName,
          parents: [process.env.GOOGLE_DRIVE_FOLDER_ID], // Pulled from .env
        },
        media: {
          mimeType: mimeType,
          body: bufferStream,
        },
        fields: 'id, webViewLink, thumbnailLink',
      },
      (err, file) => {
        if (err) return reject(err);
        // Generate public image URL for the uploaded Google Drive file
        const publicUrl = `https://lh3.googleusercontent.com/d/${file.data.id}=s400`;
        resolve(publicUrl);
      }
    );
  });
};

// Helper to convert Base64 data URL to a Buffer
const base64ToBuffer = (dataUrl) => {
  const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 string format');
  }
  return {
    mimeType: matches[1],
    buffer: Buffer.from(matches[2], 'base64'),
  };
};

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const users = await userUseCase.getAllUsers();
    res.json(UserMapper.toResDTOList ? UserMapper.toResDTOList(users) : users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/login - Authenticate or Sync User
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = await UserModel.findOne({ email: cleanEmail });

    if (!user) {
      user = await UserModel.create({
        email: cleanEmail,
        name: cleanEmail.split('@')[0],
        role: 'SUPER_ADMIN',
        password: password || 'default_pass'
      });
    }

    const resDto = UserMapper.toResDTO ? UserMapper.toResDTO(user) : user.toObject();
    res.status(200).json(resDto);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id - Update User Profile & Upload Picture to Central Google Drive
router.put('/:id', async (req, res) => {
  try {
    const paramId = req.params.id;
    const body = req.body;

    const cleanEmail = body.email ? body.email.toLowerCase().trim() : undefined;

    let finalProfilePictureUrl = body.profilePictureUrl ?? '';

    // Check if a new Base64 profile picture was sent and upload it to Google Drive
    if (finalProfilePictureUrl.startsWith('data:image')) {
      try {
        const { buffer, mimeType } = base64ToBuffer(finalProfilePictureUrl);
        const fileExtension = mimeType.split('/')[1] || 'jpeg';
        const fileName = `avatar_${paramId}_${Date.now()}.${fileExtension}`;
        
        console.log(`Uploading profile picture to central Google Drive folder...`);
        finalProfilePictureUrl = await uploadBufferToDrive(buffer, fileName, mimeType);
        console.log(`Successfully uploaded to Google Drive: ${finalProfilePictureUrl}`);
      } catch (driveErr) {
        console.error('Failed to upload profile picture to Google Drive, falling back:', driveErr);
        // Keeps original url or skips if upload fails
      }
    }

    // Build filter using strict Mongoose schema properties only
    const queryConditions = [];
    if (mongoose.Types.ObjectId.isValid(paramId)) {
      queryConditions.push({ _id: paramId });
    }
    if (cleanEmail) {
      queryConditions.push({ email: cleanEmail });
    }

    const filter =
      queryConditions.length > 0
        ? { $or: queryConditions }
        : { email: paramId.toLowerCase().trim() };

    // Explicitly construct update payload
    const updatePayload = {
      name: body.name,
      email: cleanEmail,
      role: body.role || 'SUPER_ADMIN',
      profession: body.profession ?? '',
      education: body.education ?? '',
      country: body.country ?? '',
      countryCode: body.countryCode ?? '',
      state: body.state ?? '',
      stateCode: body.stateCode ?? '',
      city: body.city ?? '',
      drive: body.driveFolderPath || body.drive || '',
      driveFolderPath: body.driveFolderPath || body.drive || '',
      causeContribution: body.causeContribution ?? '',
      profilePictureUrl: finalProfilePictureUrl,
      socialMedia: Array.isArray(body.socialMedia) ? body.socialMedia : []
    };

    // Return the updated document
    const updatedUser = await UserModel.findOneAndUpdate(
      filter,
      { $set: updatePayload },
      { new: true, returnDocument: 'after', upsert: true, runValidators: true }
    );

    const resDto = UserMapper.toResDTO
      ? UserMapper.toResDTO(updatedUser)
      : updatedUser.toObject();

    res.status(200).json(resDto);
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;