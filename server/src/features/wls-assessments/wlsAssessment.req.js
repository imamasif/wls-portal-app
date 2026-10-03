export class SubmitAssessmentReqDTO {
  constructor({ sessionId, userId, videoUrl, submissionUrl, groupNumber }) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.submissionUrl = submissionUrl || videoUrl || "";
    this.groupNumber = groupNumber || 1;
  }
}

export class GradeAssessmentReqDTO {
  constructor({
    evaluatorId,
    evaluatorName,
    scores,
    feedback,
    adminSubmissionUrl,
    isDraft,
    status,
  }) {
    this.evaluatorId = evaluatorId;
    this.evaluatorName = evaluatorName || "Evaluator";
    this.scores = scores || {};
    this.feedback = feedback || "";
    this.adminSubmissionUrl = adminSubmissionUrl || "";
    this.isDraft = isDraft || false;
    this.status = status;
  }
}

export class AssessmentMessageReqDTO {
  constructor({ senderId, senderName, senderRole, text }) {
    this.senderId = senderId;
    this.senderName = senderName || "User";
    this.senderRole = senderRole || "USER";
    this.text = text;
  }
}
