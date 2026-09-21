import mongoose from 'mongoose';

const groupAssignmentSchema = new mongoose.Schema({
  userIds: [{ type: String }],
  adminIds: [{ type: String }],
  selectedAyats: [{ type: String }],
  instructions: { type: String, default: '' }
}, { _id: false });

const wlsSessionSchema = new mongoose.Schema({
  topicName: { type: String, required: true },
  sessionDateTimeToronto: { type: Date, required: true },
  
  // 1. ADD: Missing videoDeadline field
  videoDeadline: { type: Date, default: null },

  // 2. ADD: Missing description field (for Zoom details)
  description: { type: String, default: '' },

  // 3. FIX PLURALIZATION: Pluralize keys to match frontend payload arrays
  pdfBookletUrls: [{ type: String }],
  quranVideoUrls: [{ type: String }],

  groupAssignments: {
    type: Map,
    of: groupAssignmentSchema,
    default: {}
  },
  status: { 
    type: String, 
    enum: ['NEW', 'ACTIVE', 'POSTPONED', 'COMPLETED', 'INACTIVE', 'CANCELLED'], 
    default: 'NEW' 
  },
  cancelReason: { type: String, default: '' }
}, { timestamps: true });

export const WlsSessionModel = mongoose.model('WlsSession', wlsSessionSchema);