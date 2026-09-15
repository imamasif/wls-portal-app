import { validateCreateRule } from './rule.schema.js';
import { RuleMapper } from './rule.mapper.js';

export class RuleController {
  constructor(ruleUseCase) {
    this.ruleUseCase = ruleUseCase;
  }

  getRules = async (req, res) => {
    try {
      const rules = await this.ruleUseCase.getAllRules();
      const responseDtos = rules.map(RuleMapper.toDTO);
      return res.status(200).json(responseDtos);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  };

  createRule = async (req, res) => {
    const isValid = validateCreateRule(req.body);
    if (!isValid) {
      return res.status(400).json({ error: validateCreateRule.errors });
    }

    try {
      const newRule = await this.ruleUseCase.createRule(req.body);
      return res.status(201).json(RuleMapper.toDTO(newRule));
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  };

  deleteRule = async (req, res) => {
    try {
      await this.ruleUseCase.deleteRule(req.params.id);
      return res.status(200).json({ message: "Rule criterion deleted successfully." });
    } catch (err) {
      return res.status(404).json({ error: err.message });
    }
  };
}