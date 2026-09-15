import express from 'express';
import { RuleRepository } from './rule.repository.js';
import { RuleUseCase } from './rule.usecase.js';
import { RuleController } from './rule.controller.js';

const router = express.Router();

const repository = new RuleRepository();
const useCase = new RuleUseCase(repository);
const controller = new RuleController(useCase);

router.get('/', controller.getRules);
router.post('/', controller.createRule);
router.delete('/:id', controller.deleteRule);

export default router;