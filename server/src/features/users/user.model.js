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
  type: { type: String, enum: ['Mobile', 'Work', 'Home', 'Other'], default: 'Mobile' },
  isPrimary: { type: Boolean, default: false }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { 
    type: String, 
    enum: ['SUPER_ADMIN', 'SUPER_USER', 'WLS_ADMIN', 'MARKING_ADMIN', 'STUDENT', 'USER'],
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
  socialMedia: [SocialMediaSchema],

  isActive: { type: Boolean, default: true },
  underRadar: { type: Boolean, default: false },
  radarReason: { type: String, default: '' },
  auditTrail: [AuditTrailSchema],
  createdBy: { type: String, default: 'System' },
  updatedBy: { type: String, default: 'System' }
}, { timestamps: true });

export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);