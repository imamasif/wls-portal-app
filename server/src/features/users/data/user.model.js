import mongoose from 'mongoose';

const SocialMediaSchema = new mongoose.Schema({
  platform: { type: String, default: '' },
  handleUrl: { type: String, default: '' } // ✅ Optional to allow blank entries
}, { _id: false });

const PhoneSchema = new mongoose.Schema({
  number: { type: String, default: '' },
  type: { type: String, enum: ['Mobile', 'Work', 'Home', 'Other'], default: 'Mobile' },
  isPrimary: { type: Boolean, default: false }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['SUPER_ADMIN', 'SUPER_USER', 'WLS_ADMIN', 'MARKING_ADMIN', 'STUDENT', 'USER'], // ✅ Updated role list
    default: 'USER' 
  },
  phones: [PhoneSchema],
  phone: { type: String, default: '' }, 
  profession: { type: String, default: '' },
  education: { type: String, default: '' },
  country: { type: String, default: '' },
  countryCode: { type: String, default: '' },
  state: { type: String, default: '' },
  stateCode: { type: String, default: '' },
  city: { type: String, default: '' },
  drive: { type: String, default: '' },
  driveFolderPath: { type: String, default: '' },
  causeContribution: { type: String, default: '' },
  profilePictureUrl: { type: String, default: '' },
  socialMedia: [SocialMediaSchema]
}, { timestamps: true });

export const UserModel = mongoose.model('User', UserSchema);