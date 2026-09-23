// quizSubmission.req.js
export class CreateQuizSubmissionReqDto {
  constructor(body) {
    this.quizId = body.quizId;
    this.userId = body.userId;
    this.userName = body.userName || "";
    this.answers = Array.isArray(body.answers)
      ? body.answers.map((ans) => ({
          questionIndex: ans.questionIndex,
          questionType: ans.questionType,
          selectedAnswer: ans.selectedAnswer, // Can be String, Number, or Array (for MULTIPLE_SELECT / SEQUENCE)
        }))
      : [];
  }
}
