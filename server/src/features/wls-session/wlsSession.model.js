import mongoose from 'mongoose';
import { USER_ROLES, WLS_SESSION_STATUSES } from '../../common/constants/enums.js';

const groupAssignmentSchema = new mongoose.Schema({
  userIds: [{ type: String }],
  adminIds: [{ type: String }],
  selectedAyats: [{ type: String }],
  instructions: { type: String, default: '' }
}, { _id: false });

const commentSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  userName: { type: String, required: true },
  userId: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  role: { 
    type: String, 
    enum: Object.values(USER_ROLES), 
    default: USER_ROLES.USER 
  }
}, { _id: false });

const wlsSessionSchema = new mongoose.Schema({
  topicName: { type: String, required: true },
  sessionDateTimeToronto: { type: Date, required: true },
  
  videoDeadline: { type: Date, default: null },
  description: { type: String, default: '' },

  pdfBookletUrls: [{ type: String }],
  quranVideoUrls: [{ type: String }],

  groupAssignments: {
    type: Map,
    of: groupAssignmentSchema,
    default: {}
  },
  
  comments: [commentSchema],

  status: { 
    type: String, 
    enum: Object.values(WLS_SESSION_STATUSES), 
    default: WLS_SESSION_STATUSES.NEW 
  },
  cancelReason: { type: String, default: '' }
}, { timestamps: true });

export const WlsSessionModel = mongoose.model('WlsSession', wlsSessionSchema);