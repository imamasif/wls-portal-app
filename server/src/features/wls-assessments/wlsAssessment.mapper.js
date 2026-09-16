import { SubmitAssessmentReqDTO, GradeAssessmentReqDTO } from './wlsAssessment.req.js';
import { AssessmentResDTO } from './wlsAssessment.res.js';

export class AssessmentMapper {
  static toSubmitReqDTO(body) {
    return new SubmitAssessmentReqDTO(body);
  }

  static toGradeReqDTO(body) {
    return {
      evaluatorId: body.evaluatorId,
      evaluatorName: body.evaluatorName,
      scores: body.scores || {}, // Accepts dynamic criteria object
      feedback: body.feedback || '',
      adminSubmissionUrl: body.adminSubmissionUrl || ''
    };
  }

  static toResDTO(doc) {
    if (!doc) return null;
    return {
      id: doc._id ? doc._id.toString() : doc.id,
      userId: doc.userId,
      submissionUrl: doc.submissionUrl,
      status: doc.status
    };
  }

  static toResDTOList(entities) {
    return entities.map(entity => this.toResDTO(entity));
  }
}