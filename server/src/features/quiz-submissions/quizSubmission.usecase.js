// quizSubmission.usecase.js
import { QuizSubmissionModel } from "./quizSubmission.model.js";
import { QuizModel } from "../quizzes/quiz.model.js";
import { QuizSubmissionMapper } from "./quizSubmission.mapper.js";

export class QuizSubmissionUseCase {
  async submitQuiz(dto) {
    const quiz = await QuizModel.findById(dto.quizId).lean();
    if (!quiz) throw new Error("Quiz not found.");

    if (quiz.isActive === false) {
      throw new Error(
        "Quiz is closed for submissions. The live session has ended.",
      );
    }

    let totalScore = 0;
    let maxScore = 0;

    quiz.questions.forEach((q, idx) => {
      const qPoints = q.points || 1;
      maxScore += qPoints;

      const userAnsObj = dto.answers.find((a) => a.questionIndex === idx);
      if (!userAnsObj) return;

      const userAns = userAnsObj.selectedAnswer;

      // If it's a short text input, leave it for manual grading
      if (
        q.questionType === "SHORT_ANSWER" ||
        q.questionType === "TEXT_INPUT"
      ) {
        submissionAnswers.push({
          questionIndex: idx,
          questionType: q.questionType,
          selectedAnswer: userAns,
          gradingStatus: "PENDING",
          awardedPoints: 0,
        });
        return; // Do not add points yet; instructor will grade later
      }
      const correctAns = q.correctAnswers || [];
      const correctSeq = q.correctSequence || [];

      let isCorrect = false;

      // 1. Multiple Select (Exact set match)
      if (
        (q.questionType === "MULTIPLE_SELECT" ||
          q.questionType === "MULTI_SELECT") &&
        Array.isArray(userAns)
      ) {
        const sortedUser = [...userAns].sort();
        const sortedCorrect = [...correctAns].sort();
        isCorrect =
          JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect);
      }
      // 2. Sequence Ordering (Exact sequential order match)
      else if (
        (q.questionType === "SEQUENCE" ||
          q.questionType === "SEQUENCE_ORDER") &&
        Array.isArray(userAns)
      ) {
        const targetSeq = correctSeq.length > 0 ? correctSeq : correctAns;
        isCorrect = JSON.stringify(userAns) === JSON.stringify(targetSeq);
      }
      // 3. Short Answer / Text Input
      else if (
        q.questionType === "TEXT_INPUT" ||
        q.questionType === "SHORT_ANSWER"
      ) {
        isCorrect = correctAns.some(
          (ans) =>
            String(ans).trim().toLowerCase() ===
            String(userAns).trim().toLowerCase(),
        );
      }
      // 4. Single Select / True-False
      else {
        isCorrect = correctAns.includes(String(userAns));
      }

      if (isCorrect) {
        totalScore += qPoints;
      }
    });

    const percentage =
      maxScore > 0 ? Number(((totalScore / maxScore) * 100).toFixed(2)) : 0;

    const submission = await QuizSubmissionModel.create({
      quizId: dto.quizId,
      userId: dto.userId,
      userName: dto.userName || "Student",
      answers: dto.answers,
      totalScore,
      maxScore,
      percentage,
    });

    return QuizSubmissionMapper.toResponse(submission);
  }

  async getSubmissionsByQuiz(quizId) {
    const docs = await QuizSubmissionModel.find({ quizId })
      .lean()
      .sort({ totalScore: -1 });
    return QuizSubmissionMapper.toResponseList(docs);
  }

  async getSubmissionsByUser(userId) {
    const docs = await QuizSubmissionModel.find({ userId })
      .lean()
      .sort({ submittedAt: -1 });
    return QuizSubmissionMapper.toResponseList(docs);
  }

  async gradeShortAnswer(submissionId, questionIndex, status, customPoints) {
    const submission = await QuizSubmissionModel.findById(submissionId);
    if (!submission) throw new Error("Submission not found.");

    const answer = submission.answers.find(
      (a) => a.questionIndex === questionIndex,
    );
    if (!answer) throw new Error("Answer not found in submission.");

    answer.gradingStatus = status; // 'CORRECT', 'SOMEWHAT_CORRECT', 'WRONG'

    // Assign points based on button choice (e.g., CORRECT = full points, SOMEWHAT_CORRECT = half points, WRONG = 0)
    if (status === "CORRECT") answer.awardedPoints = customPoints;
    else if (status === "SOMEWHAT_CORRECT")
      answer.awardedPoints = customPoints * 0.5;
    else answer.awardedPoints = 0;

    // Recalculate total score across all answers
    submission.totalScore = submission.answers.reduce(
      (acc, curr) => acc + (curr.awardedPoints || 0),
      0,
    );
    submission.percentage = Number(
      ((submission.totalScore / submission.maxScore) * 100).toFixed(2),
    );

    await submission.save();
    return QuizSubmissionMapper.toResponse(submission);
  }
}
