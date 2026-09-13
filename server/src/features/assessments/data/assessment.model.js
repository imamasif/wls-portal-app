import mongoose from 'mongoose';

const AssessmentSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    evaluatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    videoUrl: { type: String, required: true },
    marks: {
      presentation: { type: Number, min: 0, max: 10, default: 0 },
      transferenceOfSpirit: { type: Number, min: 0, max: 10, default: 0 },
      lightingAndCamera: { type: Number, min: 0, max: 10, default: 0 },
      attire: { type: Number, min: 0, max: 10, default: 0 },
      understanding: { type: Number, min: 0, max: 10, default: 0 }
    },
    feedbackComments: { type: String, default: '' }
  },
  { timestamps: true }
);

export const AssessmentModel = mongoose.model('Assessment', AssessmentSchema);