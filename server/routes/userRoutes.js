import express from 'express';
import multer from 'multer';
import { google } from 'googleapis';
import stream from 'stream';
import { UserModel } from '../../models/User.js'; // Adjust path to your UserModel

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const drive = google.drive({
  version: 'v3',
  auth: process.env.GOOGLE_API_KEY,
});

const uploadFileToDrive = (fileBuffer, fileName, mimeType) => {
  return new Promise((resolve, reject) => {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileBuffer);

    drive.files.create(
      {
        requestBody: {
          name: fileName,
          parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
        },
        media: {
          mimeType: mimeType,
          body: bufferStream,
        },
        fields: 'id, webViewLink, thumbnailLink',
      },
      (err, file) => {
        if (err) return reject(err);
        const publicUrl = `https://lh3.googleusercontent.com/d/${file.data.id}=s400`;
        resolve(publicUrl);
      }
    );
  });
};

// GET /api/users -> Fetches all users for UserGridView
router.get('/', async (req, res) => {
  try {
    const users = await UserModel.find({});
    return res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Server error retrieving users.' });
  }
});

// Route mounted at /api/users in server.js -> Path relative to prefix is '/:id'
router.put('/:id', upload.single('profileImage'), async (req, res) => {
  try {
    const userId = req.params.id;
    const profileData = req.body.data ? JSON.parse(req.body.data) : req.body;

    let profilePictureUrl = profileData.profilePictureUrl;

    if (req.file) {
      const fileName = `avatar_${userId}_${Date.now()}.${req.file.mimetype.split('/')[1]}`;
      profilePictureUrl = await uploadFileToDrive(req.file.buffer, fileName, req.file.mimetype);
    }

    const updatePayload = {
      name: profileData.name,
      email: profileData.email,
      profession: profileData.profession,
      education: profileData.education,
      country: profileData.country,
      countryCode: profileData.countryCode,
      state: profileData.state,
      stateCode: profileData.stateCode,
      city: profileData.city,
      driveFolderPath: profileData.driveFolderPath || profileData.drive,
      causeContribution: profileData.causeContribution,
      profilePictureUrl: profilePictureUrl,
      socialMedia: profileData.socialMedia || [],
    };

    const updatedUser = await UserModel.findByIdAndUpdate(userId, updatePayload, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found in database.' });
    }

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ error: 'Server error saving profile changes.' });
  }
});

export default router;