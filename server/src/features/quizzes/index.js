import { Router } from "express";
import { QuizUseCase } from "./quiz.usecase.js";
import { QuizController } from "./quiz.controller.js";

const router = Router();
const useCase = new QuizUseCase();
const controller = new QuizController(useCase);

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.delete);
router.post("/submit", controller.submitQuiz);

export default router;
