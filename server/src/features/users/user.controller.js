import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { userUseCase, UserMapper, UserModel } from './index.js';

const router = express.Router();

// GET /api/users - Fetch All Users
router.get('/', async (req, res) => {
  try {
    const users = await userUseCase.getAllUsers();
    res.json(UserMapper.toResDTOList ? UserMapper.toResDTOList(users) : users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users - Register New Account
router.post('/', async (req, res) => {
  try {
    const { 
      email, 
      password, 
      name, 
      phones, 
      profession, 
      education, 
      country, 
      countryCode, 
      state, 
      stateCode, 
      city, 
      drive, 
      driveFolderPath, 
      causeContribution, 
      profilePictureUrl, 
      socialMedia 
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required for registration.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await UserModel.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const validSocialMedia = Array.isArray(socialMedia)
      ? socialMedia.filter((item) => item && item.handleUrl && item.handleUrl.trim() !== '')
      : [];

    const newUser = await UserModel.create({
      email: cleanEmail,
      password: hashedPassword,
      name: name || cleanEmail.split('@')[0],
      role: 'USER',
      phones: Array.isArray(phones) ? phones : [],
      phone: phones && phones[0] ? phones[0].number : '',
      profession: profession || '',
      education: education || '',
      country: country || '',
      countryCode: countryCode || '',
      state: state || '',
      stateCode: stateCode || '',
      city: city || '',
      drive: driveFolderPath || drive || '',
      driveFolderPath: driveFolderPath || drive || '',
      causeContribution: causeContribution || '',
      profilePictureUrl: profilePictureUrl || '',
      socialMedia: validSocialMedia
    });

    const resDto = UserMapper.toResDTO ? UserMapper.toResDTO(newUser) : newUser.toObject();
    res.status(201).json(resDto);
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/login - Authenticate User
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await UserModel.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const resDto = UserMapper.toResDTO ? UserMapper.toResDTO(user) : user.toObject();
    res.status(200).json(resDto);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id/change-password - Admin or Self Password Change
router.put('/:id/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword, isAdminReset } = req.body;
    const paramId = req.params.id;

    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required.' });
    }

    const filter = mongoose.Types.ObjectId.isValid(paramId)
      ? { _id: paramId }
      : { email: paramId.toLowerCase().trim() };

    const user = await UserModel.findOne(filter);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Bypass old password verification if triggered by an Admin
    if (!isAdminReset) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect.' });
      }
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/:id - Update Profile Metadata
router.put('/:id', async (req, res) => {
  try {
    const paramId = req.params.id;
    const body = req.body;

    const filter = mongoose.Types.ObjectId.isValid(paramId)
      ? { _id: paramId }
      : { email: paramId.toLowerCase().trim() };

    const phones = Array.isArray(body.phones) ? body.phones : [];
    const primaryObj = phones.find((p) => p.isPrimary) || phones[0];
    const legacyPhone = primaryObj ? primaryObj.number : (body.phone || '');

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
      return res.status(404).json({ error: 'User not found.' });
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