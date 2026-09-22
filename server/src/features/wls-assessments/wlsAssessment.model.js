import mongoose from 'mongoose';

const evaluationSchema = new mongoose.Schema({
  evaluatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  evaluatorName: { type: String, required: true },
  scores: { 
    type: Map, 
    of: Number, 
    default: {} 
  },
  feedback: { type: String, default: '' },
  evaluatedAt: { type: Date, default: Date.now }
}, { _id: false });

// 1. Define the message schema for assessment-specific discussion
const assessmentMessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.Mixed, required: true }, // Changed from ObjectId to Mixed
  senderName: { type: String, required: true },
  senderRole: { type: String, enum: ['USER', 'WLS_ADMIN', 'SUPER_USER'], default: 'USER' },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: true });

const AssessmentSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    groupNumber: { type: Number, default: 1 },
    submissionUrl: { type: String, default: '' },
    submissionUrls: [{ type: String }],
    missedReason: { type: String, default: '' },
    status: { type: String, enum: ['PENDING', 'COMPLETED', 'REVIEWED', 'MISSED'], default: 'PENDING' },
    evaluations: [evaluationSchema],
    messages: [assessmentMessageSchema],
    finalScore: { type: Number, default: 0 },
    conclusionStatus: { type: String, enum: ['PENDING', 'PASSED', 'FAILED'], default: 'PENDING' }
  },
  { timestamps: true }
);

// ENSURE ONLY ONE ASSESSMENT PER USER PER SESSION EXISTS
AssessmentSchema.index({ sessionId: 1, userId: 1 }, { unique: true });

export const AssessmentModel = mongoose.model('Assessment', AssessmentSchema);

