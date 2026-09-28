export class SubmitAssessmentReqDTO {
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
    this.status = status || "COMPLETED";
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
    status, // <-- 1. Add status to the constructor parameters
  }) {
    this.evaluatorId = evaluatorId;
    this.evaluatorName = evaluatorName || "Evaluator";
    this.scores = scores || {};
    this.feedback = feedback || "";
    this.adminSubmissionUrl = adminSubmissionUrl || "";
    this.isDraft = isDraft || false;
    this.status = status; // <-- 2. Assign the status property
  }
}

// 3. Add message request DTO
export class AssessmentMessageReqDTO {
  constructor({ senderId, senderName, senderRole, text }) {
    this.senderId = senderId;
    this.senderName = senderName || "User";
    this.senderRole = senderRole || "USER";
    this.text = text;
  }
}
