export class AssessmentResDTO {
  constructor(entity) {
    this.id = entity._id ? entity._id.toString() : entity.id;
    this.sessionId = entity.sessionId;
    
    // Support both populated object and plain ID string
    if (entity.userId && typeof entity.userId === 'object') {
      this.userId = entity.userId._id ? entity.userId._id.toString() : entity.userId.id;
      this.user = {
        id: this.userId,
        name: entity.userId.name || '',
        email: entity.userId.email || '',
        profilePictureUrl: entity.userId.profilePictureUrl || ''
      };
    } else {
      this.userId = entity.userId;
      this.user = null;
    }

    this.groupNumber = entity.groupNumber || 1;
    this.submissionUrl = entity.submissionUrl || (entity.submissionUrls?.[0] || '');
    this.submissionUrls = entity.submissionUrls || (entity.submissionUrl ? [entity.submissionUrl] : []);
    this.missedReason = entity.missedReason || '';
    this.status = entity.status || 'PENDING';
    this.evaluations = entity.evaluations || [];
    this.finalScore = entity.finalScore || 0;
    this.conclusionStatus = entity.conclusionStatus || 'PENDING';
    this.createdAt = entity.createdAt;
  }
}