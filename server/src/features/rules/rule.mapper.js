export class RuleMapper {
  static toDTO(ruleDoc) {
    return {
      id: ruleDoc._id.toString(),
      criterion: ruleDoc.criterion,
      description: ruleDoc.description,
      isActive: ruleDoc.isActive,
      createdAt: ruleDoc.createdAt
    };
  }
}