import mongoose from 'mongoose';

const evaluationSchema = new mongoose.Schema({
  evaluatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  evaluatorName: { type: String, required: true },
  scores: {
    presentation: { type: Number, min: 0, max: 10, default: 0 },
    recitation: { type: Number, min: 0, max: 10, default: 0 },
    reflection: { type: Number, min: 0, max: 10, default: 0 }
  },
  feedback: { type: String, default: '' },
  evaluatedAt: { type: Date, default: Date.now }
}, { _id: false });

const AssessmentSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    groupNumber: { type: Number, default: 1 },
    submissionUrl: { type: String, required: true },
    status: { type: String, enum: ['PENDING', 'COMPLETED', 'REVIEWED'], default: 'PENDING' },
    evaluations: [evaluationSchema],
    finalScore: { type: Number, default: 0 },
    conclusionStatus: { type: String, enum: ['PENDING', 'PASSED', 'FAILED'], default: 'PENDING' }
  },
  { timestamps: true }
);

export const AssessmentModel = mongoose.model('Assessment', AssessmentSchema);