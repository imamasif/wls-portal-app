import express from 'express';
import mongoose from 'mongoose';
import { userUseCase, UserMapper } from './index.js';

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

// PUT /api/users/:id - Update User Profile & Social Media Links
// src/features/users/user.controller.js
router.put('/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: `Invalid MongoDB ObjectId: ${userId}` });
    }

    const existingUser = await userUseCase.getUserById(userId);
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found in database' });
    }

    const {
      name,
      email,
      password, // Optional in payload
      role,
      profession,
      education,
      country,
      countryCode,
      state,
      stateCode,
      city,
      driveFolderPath,
      drive,
      causeContribution,
      profilePictureUrl,
      socialMedia
    } = req.body;

    const updatePayload = {
      name: name || existingUser.name,
      email: email || existingUser.email,
      password: password || existingUser.password, // Preserve existing password if not provided
      role: role || existingUser.role,
      profession,
      education,
      country,
      countryCode,
      state,
      stateCode,
      city,
      drive: driveFolderPath || drive,
      causeContribution,
      profilePictureUrl,
      socialMedia: socialMedia || existingUser.socialMedia
    };

    const updatedUser = await userUseCase.updateUser(userId, updatePayload);
    res.status(200).json(updatedUser);
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;