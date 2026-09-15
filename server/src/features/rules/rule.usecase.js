export class RuleUseCase {
  constructor(ruleRepository) {
    this.ruleRepository = ruleRepository;
  }

  async getAllRules() {
    return await this.ruleRepository.findAll();
  }

  async createRule(data) {
    return await this.ruleRepository.create(data);
  }

  async deleteRule(id) {
    const deleted = await this.ruleRepository.deleteById(id);
    if (!deleted) throw new Error("Rule criterion not found.");
    return deleted;
  }
}