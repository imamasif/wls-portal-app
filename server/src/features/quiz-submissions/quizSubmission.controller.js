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
        return res
          .status(403)
          .json({
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
}
