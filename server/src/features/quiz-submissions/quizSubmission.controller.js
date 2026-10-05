import { CreateQuizSubmissionReqDto } from "./quizSubmission.req.js";
import { QuizModel } from "../quizzes/quiz.model.js";

export class QuizSubmissionController {
  constructor(useCase) {
    this.useCase = useCase;
  }

  submit = async (req, res) => {
    try {
      const dto = new CreateQuizSubmissionReqDto(req.body);

      // Check if the target quiz exists and is active before accepting submissions
      const quiz = await QuizModel.findById(dto.quizId);
      if (!quiz || quiz.isActive === false) {
        return res.status(403).json({
          error: "This quiz is inactive and no longer accepting submissions.",
        });
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

  getQuizAnalyticsReport = async (req, res) => {
    try {
      const quizAnalytics = await this.useCase.getQuizAnalyticsReport();
      res.json({ success: true, quizAnalytics });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
}
