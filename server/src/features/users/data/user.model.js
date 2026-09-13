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
  city: { type: String },
  country: { type: String },
  profilePictureUrl: { type: String },
  socialMedia: [SocialMediaSchema],
  assignedGroupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' }
}, { timestamps: true });

export const UserModel = mongoose.model('User', UserSchema);