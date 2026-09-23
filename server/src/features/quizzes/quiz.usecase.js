// quiz.usecase.js
import { QuizModel } from "./quiz.model.js";
import { QuizMapper } from "./quiz.mapper.js";

export class QuizUseCase {
  async getAllQuizzes() {
    const docs = await QuizModel.find().lean().sort({ createdAt: -1 });
    return QuizMapper.toResponseList(docs);
  }

  async getQuizById(id) {
    const doc = await QuizModel.findById(id).lean();
    if (!doc) throw new Error("Quiz not found.");
    return QuizMapper.toResponse(doc);
  }

  async createQuiz(dto) {
    const created = await QuizModel.create(dto);
    return QuizMapper.toResponse(created);
  }

  async updateQuiz(id, dto) {
    const updated = await QuizModel.findByIdAndUpdate(
      id,
      {
        title: dto.title,
        description: dto.description,
        isActive: dto.isActive,
        questions: dto.questions,
      },
      { new: true, runValidators: true },
    );
    if (!updated) throw new Error("Quiz not found.");
    return QuizMapper.toResponse(updated);
  }

  async deleteQuiz(id) {
    const deleted = await QuizModel.findByIdAndDelete(id);
    if (!deleted) throw new Error("Quiz not found.");
    return { success: true };
  }

  async submissionQuiz(dto) {
    const quiz = await QuizModel.findById(dto.quizId).lean();
    if (!quiz) throw new Error("Quiz not found.");

    let totalScore = 0;
    let maxScore = 0;

    quiz.questions.forEach((q, idx) => {
      const qPoints = q.points || 1;
      maxScore += qPoints;

      const studentAns = dto.answers.find(
        (a) => a.questionIndex === idx,
      )?.selectedAnswer;
      if (!studentAns) return;

      if (
        q.questionType === "SINGLE_SELECT" ||
        q.questionType === "TRUE_FALSE"
      ) {
        if (q.correctAnswers?.includes(studentAns)) {
          totalScore += qPoints;
        }
      } else if (q.questionType === "MULTI_SELECT") {
        const correctSet = new Set(q.correctAnswers || []);
        const studentSet = new Set(Array.isArray(studentAns) ? studentAns : []);
        if (
          correctSet.size === studentSet.size &&
          [...correctSet].every((val) => studentSet.has(val))
        ) {
          totalScore += qPoints;
        }
      } else if (q.questionType === "SEQUENCE_ORDER") {
        const correctSeq = q.correctSequence || [];
        const studentSeq = Array.isArray(studentAns) ? studentAns : [];
        const isMatch =
          correctSeq.length === studentSeq.length &&
          correctSeq.every((val, i) => val === studentSeq[i]);
        if (isMatch) {
          totalScore += qPoints;
        }
      } else if (q.questionType === "TEXT_INPUT") {
        const expected = q.correctAnswers?.[0] || "";
        if (
          expected &&
          typeof studentAns === "string" &&
          studentAns.toLowerCase().includes(expected.toLowerCase())
        ) {
          totalScore += qPoints;
        }
      }
    });

    const percentage =
      maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    return {
      quizId: quiz._id,
      totalScore,
      maxScore,
      percentage,
    };
  }

  async submitQuiz(dto) {
    const quiz = await QuizModel.findById(dto.quizId).lean();
    if (!quiz) throw new Error("Quiz not found.");

    let totalScore = 0;
    let maxScore = 0;

    quiz.questions.forEach((q, idx) => {
      const qPoints = q.points || 1;
      maxScore += qPoints;

      const studentAns = dto.answers.find(
        (a) => a.questionIndex === idx,
      )?.selectedAnswer;
      if (!studentAns) return;

      // 1. SINGLE_SELECT or TRUE_FALSE
      if (
        q.questionType === "SINGLE_SELECT" ||
        q.questionType === "TRUE_FALSE"
      ) {
        if (q.correctAnswers?.includes(studentAns)) {
          totalScore += qPoints;
        }
      }
      // 2. MULTI_SELECT
      else if (q.questionType === "MULTI_SELECT") {
        const correctSet = new Set(q.correctAnswers || []);
        const studentSet = new Set(Array.isArray(studentAns) ? studentAns : []);
        if (
          correctSet.size === studentSet.size &&
          [...correctSet].every((val) => studentSet.has(val))
        ) {
          totalScore += qPoints;
        }
      }
      // 3. SEQUENCE_ORDER
      else if (q.questionType === "SEQUENCE_ORDER") {
        const correctSeq = q.correctSequence || [];
        const studentSeq = Array.isArray(studentAns) ? studentAns : [];
        const isMatch =
          correctSeq.length === studentSeq.length &&
          correctSeq.every((val, i) => val === studentSeq[i]);
        if (isMatch) {
          totalScore += qPoints;
        }
      }
      // 4. TEXT_INPUT
      else if (q.questionType === "TEXT_INPUT") {
        const expected = q.correctAnswers?.[0] || "";
        if (
          expected &&
          typeof studentAns === "string" &&
          studentAns.toLowerCase().trim() === expected.toLowerCase().trim()
        ) {
          totalScore += qPoints;
        }
      }
    });

    const percentage =
      maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    return {
      quizId: quiz._id,
      totalScore,
      maxScore,
      percentage,
    };
  }
}
