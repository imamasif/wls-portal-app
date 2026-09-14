import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { userUseCase, UserMapper, UserModel } from './index.js';

const router = express.Router();

// Helper to safely find user by ObjectId or Email
const findUserByIdOrEmail = async (paramId, selectPassword = false) => {
  const filter = mongoose.Types.ObjectId.isValid(paramId)
    ? { _id: paramId }
    : { email: decodeURIComponent(paramId).toLowerCase().trim() };

  const query = UserModel.findOne(filter);
  if (selectPassword) query.select('+password');
  return await query;
};

// Helper to record audit logs
const appendAuditLog = (userDoc, action, performedBy, details) => {
  if (!userDoc.auditTrail) userDoc.auditTrail = [];
  userDoc.auditTrail.push({
    action,
    performedBy: performedBy || 'System/Admin',
    performedAt: new Date(),
    details: details || ''
  });
  userDoc.updatedBy = performedBy || 'System/Admin';
};

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
      socialMedia: validSocialMedia,
      createdBy: cleanEmail,
      updatedBy: cleanEmail,
      auditTrail: [{
        action: 'USER_REGISTERED',
        performedBy: cleanEmail,
        performedAt: new Date(),
        details: 'Account created'
      }]
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
    const user = await UserModel.findOne({ email: cleanEmail }).select('+password');

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ error: 'Account is disabled. Please contact an administrator.' });
    }

    if (!user.password) {
      return res.status(401).json({ error: 'Account password not configured properly.' });
    }

    const isMatch = await bcrypt.compare(String(password), String(user.password));
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const resDto = UserMapper.toResDTO ? UserMapper.toResDTO(user) : user.toObject();
    delete resDto.password;
    res.status(200).json(resDto);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id/change-password
router.put('/:id/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword, isAdminReset, performerEmail } = req.body;
    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required.' });
    }

    const user = await findUserByIdOrEmail(req.params.id, true);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!isAdminReset) {
      if (!currentPassword || !user.password) {
        return res.status(400).json({ message: 'Current password is required.' });
      }
      const isMatch = await bcrypt.compare(String(currentPassword), String(user.password));
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect.' });
      }
    }

    user.password = await bcrypt.hash(newPassword, 10);
    appendAuditLog(
      user, 
      isAdminReset ? 'ADMIN_PASSWORD_RESET' : 'SELF_PASSWORD_CHANGE', 
      performerEmail || user.email, 
      'Password updated'
    );
    await user.save();

    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/:id/status
router.put('/:id/status', async (req, res) => {
  try {
    const { isActive, performerEmail } = req.body;
    const user = await findUserByIdOrEmail(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.isActive = isActive;
    appendAuditLog(
      user,
      isActive ? 'ENABLE_ACCOUNT' : 'DISABLE_ACCOUNT',
      performerEmail,
      `User account status changed to ${isActive ? 'Active' : 'Inactive'}`
    );
    await user.save();

    const resDto = UserMapper.toResDTO ? UserMapper.toResDTO(user) : user.toObject();
    res.status(200).json(resDto);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id/radar
router.put('/:id/radar', async (req, res) => {
  try {
    const { underRadar, radarReason, performerEmail } = req.body;
    const user = await findUserByIdOrEmail(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.underRadar = Boolean(underRadar);
    user.radarReason = underRadar ? (radarReason || '') : '';
    appendAuditLog(
      user,
      underRadar ? 'MARK_UNDER_RADAR' : 'UNMARK_UNDER_RADAR',
      performerEmail,
      underRadar ? `Flagged: ${radarReason}` : 'Radar flag cleared'
    );
    await user.save();

    const resDto = UserMapper.toResDTO ? UserMapper.toResDTO(user) : user.toObject();
    res.status(200).json(resDto);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  try {
    const user = await findUserByIdOrEmail(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    await UserModel.deleteOne({ _id: user._id });
    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id - Update Profile Metadata
router.put('/:id', async (req, res) => {
  try {
    const body = req.body;
    const user = await findUserByIdOrEmail(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const phones = Array.isArray(body.phones) ? body.phones : [];
    const primaryObj = phones.find((p) => p.isPrimary) || phones[0];
    const legacyPhone = primaryObj ? primaryObj.number : (body.phone || '');

    const validSocialMedia = Array.isArray(body.socialMedia)
      ? body.socialMedia.filter((item) => item && item.handleUrl && item.handleUrl.trim() !== '')
      : [];

    user.name = body.name ?? user.name;
    user.email = body.email ? body.email.toLowerCase().trim() : user.email;
    user.role = body.role ?? user.role;
    user.phones = phones;
    user.phone = legacyPhone;
    user.profession = body.profession ?? user.profession;
    user.education = body.education ?? user.education;
    user.country = body.country ?? user.country;
    user.countryCode = body.countryCode ?? user.countryCode;
    user.state = body.state ?? user.state;
    user.stateCode = body.stateCode ?? user.stateCode;
    user.city = body.city ?? user.city;
    user.drive = body.driveFolderPath || body.drive || user.drive;
    user.driveFolderPath = body.driveFolderPath || body.drive || user.driveFolderPath;
    user.causeContribution = body.causeContribution ?? user.causeContribution;
    user.profilePictureUrl = body.profilePictureUrl ?? user.profilePictureUrl;
    user.socialMedia = validSocialMedia;

    appendAuditLog(user, 'UPDATE_PROFILE', body.performerEmail, 'Profile details updated');
    await user.save();

    const resDto = UserMapper.toResDTO ? UserMapper.toResDTO(user) : user.toObject();
    return res.status(200).json(resDto);
  } catch (err) {
    console.error('Error updating user profile:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;