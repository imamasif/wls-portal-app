export class WlsReportingMapper {
  static toResDTO(entity) {
    if (!entity) return null;
    return {
      id: entity._id,
      userId: entity.userId,
      groupNumber: entity.groupNumber,
      videoLink: entity.videoLink,
      status: entity.status,
      evaluations: entity.evaluations || [],
      finalScore: entity.finalScore,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  static toResDTOList(entities) {
    if (!Array.isArray(entities)) return [];
    return entities.map(e => WlsReportingMapper.toResDTO(e));
  }

  static toSubmitReqDTO(body) {
    return {
      userId: body.userId,
      groupNumber: body.groupNumber || 1,
      videoLink: body.videoLink
    };
  }

  static toGradeReqDTO(body) {
    return {
      adminId: body.adminId,
      score: body.score,
      feedback: body.feedback,
      finalScore: body.finalScore
    };
  }
}