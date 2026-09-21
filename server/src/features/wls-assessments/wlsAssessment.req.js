export class SubmitAssessmentReqDTO {
  constructor({ sessionId, userId, videoUrl, groupNumber }) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.videoUrl = videoUrl;
    this.groupNumber = groupNumber || 1;
  }
}

export class GradeAssessmentReqDTO {
  constructor({ evaluatorId, evaluatorName, scores, feedback, adminSubmissionUrl, isDraft }) {
    this.evaluatorId = evaluatorId;
    this.evaluatorName = evaluatorName || 'Evaluator';
    this.scores = scores || {};
    this.feedback = feedback || '';
    this.adminSubmissionUrl = adminSubmissionUrl || '';
    this.isDraft = isDraft || false; // Fixed undefined variable error
  }
}

// 3. Add message request DTO
export class AssessmentMessageReqDTO {
  constructor({ senderId, senderName, senderRole, text }) {
    this.senderId = senderId;
    this.senderName = senderName || 'User';
    this.senderRole = senderRole || 'USER';
    this.text = text;
  }
}