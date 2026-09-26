export class RuleMapper {
  static toDTO(ruleDoc) {
    return {
      id: ruleDoc._id.toString(),
      key: ruleDoc.key,
      criterion: ruleDoc.criterion,
      description: ruleDoc.description,
      maxScore: ruleDoc.maxScore || 10,
      isActive: ruleDoc.isActive,
      createdAt: ruleDoc.createdAt,
    };
  }
}
