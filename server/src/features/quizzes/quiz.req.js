// quiz.req.js
export class CreateQuizReqDto {
  constructor(body) {
    this.title = body.title;
    this.description = body.description || "";
    this.createdBy = body.createdBy;
    this.isActive = body.isActive ?? true;
    this.questions = Array.isArray(body.questions)
      ? body.questions.map((q) => ({
          questionText: q.questionText,
          questionType: q.questionType,
          imageUrl: q.imageUrl || "",
          options: q.options || [],
          correctAnswers: q.correctAnswers || [],
          sequenceItems: q.sequenceItems || [], // <-- Added for sequence ordering
          correctSequence: q.correctSequence || [], // <-- Added for sequence ordering
          points: q.points || 1,
        }))
      : [];
  }
}
