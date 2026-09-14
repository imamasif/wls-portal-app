import express from 'express';
import mongoose from 'mongoose';
import { google } from 'googleapis';
import stream from 'stream';
import { userUseCase, UserMapper, UserModel } from './index.js';

const router = express.Router();

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
        role: req.body.role || 'USER', // ✅ Default new accounts to 'USER'
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

// PUT /api/users/:id - Update User Profile, Roles & Phones
router.put('/:id', async (req, res) => {
  try {
    const paramId = req.params.id;
    const body = req.body;

    const filter = mongoose.Types.ObjectId.isValid(paramId)
      ? { _id: paramId }
      : { email: paramId.toLowerCase().trim() };

    // Safely parse phones array
    const phones = Array.isArray(body.phones) ? body.phones : [];
    const primaryObj = phones.find((p) => p.isPrimary) || phones[0];
    const legacyPhone = primaryObj ? primaryObj.number : (body.phone || '');

    // Filter out invalid/empty social media entries
    const validSocialMedia = Array.isArray(body.socialMedia)
      ? body.socialMedia.filter((item) => item && item.handleUrl && item.handleUrl.trim() !== '')
      : [];

    const updatePayload = {
      ...(body.name && { name: body.name }),
      ...(body.email && { email: body.email.toLowerCase().trim() }),
      ...(body.role && { role: body.role }),
      phones,
      phone: legacyPhone,
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
      profilePictureUrl: body.profilePictureUrl ?? '',
      socialMedia: validSocialMedia
    };

    const updatedUser = await UserModel.findOneAndUpdate(
      filter,
      { $set: updatePayload },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const resDto = UserMapper.toResDTO
      ? UserMapper.toResDTO(updatedUser)
      : updatedUser.toObject();

    return res.status(200).json(resDto);
  } catch (err) {
    console.error('Error updating user profile:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;