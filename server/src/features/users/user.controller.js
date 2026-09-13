import express from 'express';
import mongoose from 'mongoose';
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

// PUT /api/users/:id - Update User Profile
router.put('/:id', async (req, res) => {
  try {
    const paramId = req.params.id;
    const body = req.body;

    const cleanEmail = body.email ? body.email.toLowerCase().trim() : undefined;

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

    // Explicitly construct update payload without conditional stripping
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
      profilePictureUrl: body.profilePictureUrl ?? '',
      socialMedia: Array.isArray(body.socialMedia) ? body.socialMedia : []
    };

    // Return the updated document using returnDocument: 'after' / new: true
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