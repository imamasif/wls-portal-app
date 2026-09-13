const express = require('express');
const router = express.Router();
const multer = require('multer');
const { google } = require('googleapis');
const stream = require('stream');

const upload = multer();

// Configure Google Drive API Client with Service Account or OAuth2 Credentials
const auth = new google.auth.GoogleAuth({
  keyFile: 'google-credentials.json', // Path to service account JSON
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

router.post('/upload-profile-picture', upload.single('photo'), async (req, res) => {
  try {
    const { fullName } = req.body;
    const file = req.file;

    if (!file || !fullName) {
      return res.status(400).json({ error: 'File and full name are required.' });
    }

    // Format file name based on user's full name
    const sanitizedName = fullName.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${sanitizedName}_ProfilePhoto.jpg`;

    // Stream buffer into Google Drive API
    const bufferStream = new stream.PassThrough();
    bufferStream.end(file.buffer);

    const driveResponse = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID], // Pulled directly from .env
      },
      media: {
        mimeType: file.mimetype,
        body: bufferStream,
      },
      fields: 'id, webViewLink, webContentLink',
    });

    res.status(200).json({
      message: 'Photo uploaded to Google Drive successfully',
      fileId: driveResponse.data.id,
      profilePictureUrl: driveResponse.data.webViewLink,
    });
  } catch (error) {
    console.error('Google Drive Upload Error:', error);
    res.status(500).json({ error: 'Failed to upload photo to Google Drive.' });
  }
});

module.exports = router;