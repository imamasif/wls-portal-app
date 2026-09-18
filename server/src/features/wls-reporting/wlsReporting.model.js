import mongoose from 'mongoose';

const evaluationSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  score: { type: Number },
  feedback: { type: String },
  evaluatedAt: { type: Date, default: Date.now }
}, { _id: false });

const reportingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'WlsSession' }, // Add session binding if applicable
  groupNumber: { type: Number, default: 1 },
  videoLink: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'REVIEWED', 'COMPLETED'], default: 'PENDING' },
  evaluations: [evaluationSchema],
  finalScore: { type: Number, default: 0 },
}, { timestamps: true });

// Prevent accidental overwrites/duplicates per user & session
reportingSchema.index({ userId: 1, sessionId: 1 }, { unique: true, sparse: true });

export const WlsReportingModel = mongoose.model('WlsReporting', reportingSchema, 'wls_reports');