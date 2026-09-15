import { Router } from 'express';
import { WlsSessionUseCase } from './wlsSession.usecase.js';
import { WlsSessionController } from './wlsSession.controller.js';

const router = Router();
const useCase = new WlsSessionUseCase();
const controller = new WlsSessionController(useCase);

router.get('/', controller.getAll);
router.post('/', controller.create);
router.delete('/:id', controller.delete);

export default router;