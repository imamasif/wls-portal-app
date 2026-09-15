export class SubmitAssessmentReqDTO {
  constructor({ sessionId, userId, videoUrl, groupNumber }) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.videoUrl = videoUrl;
    this.groupNumber = groupNumber || 1;
  }
}

export class GradeAssessmentReqDTO {
  constructor({ evaluatorId, evaluatorName, scores, feedback }) {
    this.evaluatorId = evaluatorId;
    this.evaluatorName = evaluatorName || 'Evaluator';
    this.scores = {
      presentation: scores?.presentation || 0,
      recitation: scores?.recitation || 0,
      reflection: scores?.reflection || 0
    };
    this.feedback = feedback || '';
  }
}