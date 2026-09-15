import { RuleModel } from './rule.model.js';

export class RuleRepository {
  async findAll() {
    return await RuleModel.find({}).sort({ createdAt: 1 });
  }

  async create(ruleData) {
    return await RuleModel.create(ruleData);
  }

  async deleteById(id) {
    return await RuleModel.findByIdAndDelete(id);
  }
}