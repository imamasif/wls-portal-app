import { CreateQuizSubmissionReqDto } from "./quizSubmission.req.js";

export class QuizSubmissionController {
  constructor(useCase) {
    this.useCase = useCase;
  }

  submit = async (req, res) => {
    try {
      const dto = new CreateQuizSubmissionReqDto(req.body);

      // Check if the target quiz is active before accepting submissions
      const quiz = await Quiz.findById(dto.quizId);
      if (!quiz || !quiz.isActive) {
        return res.status(403).json({
          error: "This quiz is inactive and no longer accepting submissions.",
        }); // <-- Removed dot before status
      }

      const result = await this.useCase.submitQuiz(dto);
      res.status(201).json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  getByQuiz = async (req, res) => {
    try {
      const results = await this.useCase.getSubmissionsByQuiz(
        req.params.quizId,
      );
      res.json(results);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  getByUser = async (req, res) => {
    try {
      const results = await this.useCase.getSubmissionsByUser(
        req.params.userId,
      );
      res.json(results);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  // Add inside QuizSubmissionController
  getQuizAnalyticsReport = async (req, res) => {
    try {
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

      const quizAnalytics = Object.values(quizMap).map((q) => ({
        title: q.title,
        totalSubmissions: q.totalSubmissions,
        averageScore:
          q.totalSubmissions > 0
            ? Math.round(q.scoreSum / q.totalSubmissions)
            : 0,
        passedCount: q.passedCount,
        failedCount: q.failedCount,
      }));

      res.json({ success: true, quizAnalytics });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
}
