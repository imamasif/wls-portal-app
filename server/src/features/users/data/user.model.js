import mongoose from 'mongoose';

const SocialMediaSchema = new mongoose.Schema({
  platform: { type: String, required: true }, // e.g., 'YouTube', 'Facebook', 'Twitter'
  handleUrl: { type: String, required: true }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }, // Hashed
  role: { 
    type: String, 
    enum: ['SUPER_ADMIN', 'WLS_ADMIN', 'MARKING_ADMIN', 'STUDENT'], 
    default: 'STUDENT' 
  },
  profession: { type: String },
    education: { type: String },
    country: { type: String },
    countryCode: { type: String },
    state: { type: String },
    stateCode: { type: String },
    city: { type: String },
    drive: { type: String },
    causeContribution: { type: String },
    profilePictureUrl: { type: String },
    socialMedia: [SocialMediaSchema]
  },
  { timestamps: true }
);

export const UserModel = mongoose.model('User', UserSchema);