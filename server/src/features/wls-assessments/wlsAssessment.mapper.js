import { SubmitAssessmentReqDTO, GradeAssessmentReqDTO, AssessmentMessageReqDTO } from './wlsAssessment.req.js';
import { AssessmentResDTO } from './wlsAssessment.res.js';

export class AssessmentMapper {
  static toSubmitReqDTO(body) {
    return new SubmitAssessmentReqDTO(body);
  }

  static toGradeReqDTO(body) {
    return new GradeAssessmentReqDTO(body);
  }

  static toMessageReqDTO(body) {
    return new AssessmentMessageReqDTO(body);
  }

  static toResDTO(doc) {
    if (!doc) return null;
    const docObj = doc.toObject ? doc.toObject() : doc;
    return new AssessmentResDTO(docObj);
  }

  static toResDTOList(entities) {
    return entities.map(entity => this.toResDTO(entity));
  }
}