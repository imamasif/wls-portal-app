import mongoose from 'mongoose';

const ruleSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // e.g., 'arabicReading', 'attire'
  criterion: { type: String, required: true },         // e.g., 'Arabic Reading / Recitation'
  description: { type: String, default: '' },
  maxScore: { type: Number, default: 10 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const RuleModel = mongoose.model('Rule', ruleSchema);