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
    const processedAnswers = [];

    quiz.questions.forEach((q, idx) => {
      const qPoints = q.points || 1;
      maxScore += qPoints;

      const userAnsObj = dto.answers.find((a) => a.questionIndex === idx);
      if (!userAnsObj) {
        processedAnswers.push({
          questionIndex: idx,
          questionType: q.questionType,
          selectedAnswer: null,
          gradingStatus: "WRONG",
          isCorrect: false,
          awardedPoints: 0,
        });
        return;
      }

      const userAns = userAnsObj.selectedAnswer;
      const correctAns = q.correctAnswers || [];
      const correctSeq = q.correctSequence || [];

      let isCorrect = false;
      let gradingStatus = "PENDING";
      let awardedPoints = 0;

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
        gradingStatus = isCorrect ? "CORRECT" : "WRONG";
        awardedPoints = isCorrect ? qPoints : 0;
      }
      // 2. Sequence Ordering (Exact sequential order match)
      else if (
        (q.questionType === "SEQUENCE" ||
          q.questionType === "SEQUENCE_ORDER") &&
        Array.isArray(userAns)
      ) {
        const targetSeq = correctSeq.length > 0 ? correctSeq : correctAns;
        isCorrect = JSON.stringify(userAns) === JSON.stringify(targetSeq);
        gradingStatus = isCorrect ? "CORRECT" : "WRONG";
        awardedPoints = isCorrect ? qPoints : 0;
      }
      // 3. Short Answer / Text Input (Auto-grade if exact match or keyword match, else leave PENDING for manual review)
      else if (
        q.questionType === "TEXT_INPUT" ||
        q.questionType === "SHORT_ANSWER"
      ) {
        const expected = correctAns?.[0] || "";
        isCorrect =
          expected &&
          typeof userAns === "string" &&
          String(userAns).trim().toLowerCase() ===
            String(expected).trim().toLowerCase();

        gradingStatus = isCorrect ? "CORRECT" : "PENDING";
        awardedPoints = isCorrect ? qPoints : 0;
      }
      // 4. Single Select / True-False
      else {
        isCorrect = correctAns.includes(String(userAns));
        gradingStatus = isCorrect ? "CORRECT" : "WRONG";
        awardedPoints = isCorrect ? qPoints : 0;
      }

      if (isCorrect) {
        totalScore += awardedPoints;
      }

      processedAnswers.push({
        questionIndex: idx,
        questionType: q.questionType,
        selectedAnswer: userAns,
        gradingStatus,
        isCorrect,
        awardedPoints,
      });
    });

    const percentage =
      maxScore > 0 ? Number(((totalScore / maxScore) * 100).toFixed(2)) : 0;

    const submission = await QuizSubmissionModel.create({
      quizId: dto.quizId,
      userId: dto.userId,
      userName: dto.userName || "Student",
      answers: processedAnswers,
      totalScore,
      maxScore,
      percentage,
      isFullyGraded: !processedAnswers.some(
        (a) => a.gradingStatus === "PENDING",
      ),
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

    if (status === "CORRECT") answer.awardedPoints = customPoints;
    else if (status === "SOMEWHAT_CORRECT")
      answer.awardedPoints = customPoints * 0.5;
    else answer.awardedPoints = 0;

    answer.isCorrect = status === "CORRECT";

    submission.totalScore = submission.answers.reduce(
      (acc, curr) => acc + (curr.awardedPoints || 0),
      0,
    );
    submission.percentage = Number(
      ((submission.totalScore / submission.maxScore) * 100).toFixed(2),
    );
    submission.isFullyGraded = !submission.answers.some(
      (a) => a.gradingStatus === "PENDING",
    );

    await submission.save();
    return QuizSubmissionMapper.toResponse(submission);
  }

  async getQuizAnalyticsReport() {
    const submissions = await QuizSubmissionModel.find({})
      .populate("quizId", "title isPublished")
      .lean();

    const quizMap = {};

    submissions.forEach((sub) => {
      const quiz = sub.quizId;
      if (!quiz) return;
      const quizTitle = quiz.title || "Untitled Quiz";

      if (!quizMap[quizTitle]) {
        quizMap[quizTitle] = {
          title: quizTitle,
          totalSubmissions: 0,
          scoreSum: 0,
          passedCount: 0,
          failedCount: 0,
        };
      }

      quizMap[quizTitle].totalSubmissions += 1;
      quizMap[quizTitle].scoreSum += sub.totalScore || 0;

      if (sub.percentage >= 60) {
        quizMap[quizTitle].passedCount += 1;
      } else {
        quizMap[quizTitle].failedCount += 1;
      }
    });

    return Object.values(quizMap).map((q) => ({
      title: q.title,
      totalSubmissions: q.totalSubmissions,
      averageScore:
        q.totalSubmissions > 0
          ? Math.round(q.scoreSum / q.totalSubmissions)
          : 0,
      passedCount: q.passedCount,
      failedCount: q.failedCount,
    }));
  }
}
