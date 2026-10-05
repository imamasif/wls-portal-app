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
          questionImageUrl: q.questionImageUrl || q.imageUrl || "",
          questionImage:
            q.questionImage || q.questionImageUrl || q.imageUrl || "",
          options: q.options || [],
          correctAnswers: q.correctAnswers || [],
          sampleAnswer: q.sampleAnswer || "", // <-- Preserves short answer / keyword data
          sequenceItems: q.sequenceItems || [],
          correctSequence: q.correctSequence || [],
          points: q.points || 1,
        }))
      : [];
  }
}
