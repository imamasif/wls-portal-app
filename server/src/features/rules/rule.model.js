import mongoose from 'mongoose';

const ruleSchema = new mongoose.Schema({
  criterion: { type: String, required: true },
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const RuleModel = mongoose.model('Rule', ruleSchema);