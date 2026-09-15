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
  pdfBookletUrl: [{ type: String, default: '' }],
  quranVideoUrl: [{ type: String, default: '' }],
  groupAssignments: {
    type: Map,
    of: groupAssignmentSchema,
    default: {}
  },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'CANCELLED'], default: 'ACTIVE' },
  cancelReason: { type: String, default: '' }
}, { timestamps: true });

export const WlsSessionModel = mongoose.model('WlsSession', wlsSessionSchema);