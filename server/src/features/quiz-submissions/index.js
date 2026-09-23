
// index.js (Submission Router)
import { Router } from 'express';
import { QuizSubmissionUseCase } from './quizSubmission.usecase.js';
import { QuizSubmissionController } from './quizSubmission.controller.js';

const router = Router();
const useCase = new QuizSubmissionUseCase();
const controller = new QuizSubmissionController(useCase);

router.post('/', controller.submit);
router.get('/quiz/:quizId', controller.getByQuiz);
router.get('/user/:userId', controller.getByUser);

export default router;