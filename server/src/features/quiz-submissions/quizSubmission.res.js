export class QuizSubmissionResDto {
  constructor(doc) {
    this.id = doc._id || doc.id;
    this.quizId = doc.quizId;
    this.userId = doc.userId;
    this.userName = doc.userName;
    this.answers = doc.answers;
    this.totalScore = doc.totalScore;
    this.maxScore = doc.maxScore;
    this.percentage = doc.percentage;
    this.submittedAt = doc.submittedAt;
  }
}