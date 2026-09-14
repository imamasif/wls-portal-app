import mongoose from 'mongoose';

const SocialMediaSchema = new mongoose.Schema({
  platform: { type: String, required: true },
  handleUrl: { type: String, required: true }
}, { _id: false });

const PhoneSchema = new mongoose.Schema({
  number: { type: String, required: true },
  type: { type: String, enum: ['Mobile', 'Work', 'Home', 'Other'], default: 'Mobile' },
  isPrimary: { type: Boolean, default: false }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['SUPER_ADMIN', 'WLS_ADMIN', 'MARKING_ADMIN', 'STUDENT'], 
    default: 'STUDENT' 
  },
  phones: [PhoneSchema],
  phone: { type: String }, // Backwards compatibility legacy field
  profession: { type: String },
  education: { type: String },
  country: { type: String },
  countryCode: { type: String },
  state: { type: String },
  stateCode: { type: String },
  city: { type: String },
  drive: { type: String },
  driveFolderPath: { type: String },
  causeContribution: { type: String },
  profilePictureUrl: { type: String },
  socialMedia: [SocialMediaSchema]
}, { timestamps: true });

export const UserModel = mongoose.model('User', UserSchema);