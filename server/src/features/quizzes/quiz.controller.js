// quiz.controller.js
import { validateCreateQuiz } from "./quiz.schema.js";
import { CreateQuizReqDto } from "./quiz.req.js";
import { USER_ROLES } from "../../common/constants/enums.js";

export class QuizController {
  constructor(useCase) {
    this.useCase = useCase;
  }

  getAll = async (req, res) => {
    try {
      const allQuizzes = await this.useCase.getAllQuizzes();

      const userRole = req.user?.role;
      if (
        !userRole ||
        userRole === USER_ROLES.SUPER_USER ||
        userRole === USER_ROLES.WLS_ADMIN
      ) {
        return res.json(allQuizzes);
      }

      const activeQuizzes = allQuizzes.filter((q) => q.isActive === true);
      res.json(activeQuizzes);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  getById = async (req, res) => {
    try {
      const data = await this.useCase.getQuizById(req.params.id);
      res.json(data);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  };

  create = async (req, res) => {
    if (!validateCreateQuiz(req.body)) {
      return res.status(400).json({ errors: validateCreateQuiz.errors });
    }
    try {
      const dto = new CreateQuizReqDto(req.body);
      const result = await this.useCase.createQuiz(dto);
      res.status(201).json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  update = async (req, res) => {
    try {
      const dto = new CreateQuizReqDto(req.body);
      const result = await this.useCase.updateQuiz(req.params.id, dto);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  delete = async (req, res) => {
    try {
      await this.useCase.deleteQuiz(req.params.id);
      res.json({ message: "Quiz deleted successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  submitQuiz = async (req, res) => {
    try {
      const result = await this.useCase.submitQuiz(req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
}
