import { QuizResDto } from './quiz.res.js';

export const QuizMapper = {
  toResponse(doc) {
    if (!doc) return null;
    return new QuizResDto(doc);
  },
  toResponseList(docs = []) {
    return docs.map((doc) => this.toResponse(doc));
  }
};