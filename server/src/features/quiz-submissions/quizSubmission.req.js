// quizSubmission.req.js
export class CreateQuizSubmissionReqDto {
  constructor(body) {
    this.quizId = body.quizId;
    this.userId = body.userId;
    this.userName = body.userName || "Student";
    this.answers = Array.isArray(body.answers)
      ? body.answers.map((a) => ({
          questionIndex: a.questionIndex,
          questionType: a.questionType,
          selectedAnswer: a.selectedAnswer,
        }))
      : [];
  }
}
