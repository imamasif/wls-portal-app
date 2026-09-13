import mongoose from 'mongoose';

const VerseSequenceSchema = new mongoose.Schema({
  order: { type: Number, required: true },
  chapterNumber: { type: Number, required: true },
  verseRange: { type: String, required: true }, // e.g., '27-29'
  partDescription: { type: String } // e.g., 'Recitation / Understanding'
}, { _id: false });

const GroupSchema = new mongoose.Schema({
  groupName: { type: String, required: true },
  evaluatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Assigned Admin
  assignedUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  verseSequences: [VerseSequenceSchema]
});

const SessionSchema = new mongoose.Schema({
  weekNumber: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  groups: [GroupSchema],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const SessionModel = mongoose.model('Session', SessionSchema);