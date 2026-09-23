import { QuizSubmissionResDto } from './quizSubmission.res.js';

export const QuizSubmissionMapper = {
  toResponse(doc) {
    if (!doc) return null;
    return new QuizSubmissionResDto(doc);
  },
  toResponseList(docs = []) {
    return docs.map((doc) => this.toResponse(doc));
  }
};