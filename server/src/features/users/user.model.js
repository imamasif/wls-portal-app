import mongoose from 'mongoose';

const AuditTrailSchema = new mongoose.Schema({
  action: { type: String, required: true },
  performedBy: { type: String, required: true },
  performedAt: { type: Date, default: Date.now },
  details: { type: String, default: '' }
}, { _id: false });

const SocialMediaSchema = new mongoose.Schema({
  platform: { type: String, default: '' },
  handleUrl: { type: String, default: '' }
}, { _id: false });

const PhoneSchema = new mongoose.Schema({
  number: { type: String, default: '' },
  type: { 
    type: String, 
    enum: ['Mobile', 'Work', 'Home', 'Other'], 
    default: 'Mobile' 
  },
  isPrimary: { type: Boolean, default: false }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { 
    type: String, 
    enum: ['SUPER_USER', 'WLS_ADMIN', 'USER'],
    default: 'USER' 
  },
  groupNumbers: { type: [Number], default: [1] },
  isActive: { type: Boolean, default: true },
  underRadar: { type: Boolean, default: false },
  radarReason: { type: String, default: '' },
  country: { type: String, default: 'Canada' },
  city: { type: String, default: 'Toronto' },
  profession: { type: String, default: '' },
  education: { type: String, default: '' },
  countryCode: { type: String, default: 'CA' },
  state: { type: String, default: '' },
  stateCode: { type: String, default: '' },
  drive: { type: String, default: '' },
  driveFolderPath: { type: String, default: '' },
  causeContribution: { type: String, default: '' },
  profilePictureUrl: { type: String, default: '' },
  phone: { type: String, default: '' },
  phones: [PhoneSchema],
  socialMedia: [SocialMediaSchema],
  createdBy: { type: String, default: 'System' },
  updatedBy: { type: String, default: 'System' },
  auditTrail: [AuditTrailSchema]
}, { timestamps: true });

export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);