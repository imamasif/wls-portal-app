import mongoose from 'mongoose';
import { socialGroupSchema } from './social.schema.js';

const SocialGroupMemberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, required: true },
  assignedAt: { type: Date, default: Date.now }
}, { _id: false });

const SocialGroupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['WHATSAPP', 'MICROSOFT_TEAMS', 'ONLINE_UNIVERSITY'] 
  },
  isActive: { type: Boolean, default: true },
  allowedRoles: [{ type: String }],
  members: [SocialGroupMemberSchema]
}, { timestamps: true });

export const SocialGroupModel = mongoose.model('SocialGroup', SocialGroupSchema);