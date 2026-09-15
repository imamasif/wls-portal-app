import { SubmitAssessmentReqDTO, GradeAssessmentReqDTO } from './assessment.req.js';
import { AssessmentResDTO } from './assessment.res.js';

export class AssessmentMapper {
  static toSubmitReqDTO(body) {
    return new SubmitAssessmentReqDTO(body);
  }

  static toGradeReqDTO(body) {
    return new GradeAssessmentReqDTO(body);
  }

  static toResDTO(entity) {
    if (!entity) return null;
    return new AssessmentResDTO(entity);
  }

  static toResDTOList(entities) {
    return entities.map(entity => this.toResDTO(entity));
  }
}