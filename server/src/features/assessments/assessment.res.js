export class AssessmentResDTO {
  constructor(entity) {
    this.id = entity._id ? entity._id.toString() : entity.id;
    this.sessionId = entity.sessionId;
    this.userId = entity.userId;
    this.groupNumber = entity.groupNumber;
    this.submissionUrl = entity.submissionUrl || entity.videoUrl;
    this.status = entity.status;
    this.evaluations = entity.evaluations || [];
    this.finalScore = entity.finalScore || 0;
    this.conclusionStatus = entity.conclusionStatus || 'PENDING';
    this.createdAt = entity.createdAt;
  }
}