import express from 'express';
import mongoose from 'mongoose';
import { assessmentUseCase } from './wlsAssessment.usecase.js';
import { AssessmentMapper } from './wlsAssessment.mapper.js';
import { submitAssessmentSchema, gradeAssessmentSchema } from './wlsAssessment.schema.js';
import { validateSchema } from '../../common/middleware/validateSchema.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const data = await assessmentUseCase.getAllAssessments();
    res.json(AssessmentMapper.toResDTOList(data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ error: 'Invalid User ObjectId' });
    }
    const userSubmissions = await assessmentUseCase.getUserSubmissions(req.params.userId);
    res.json(AssessmentMapper.toResDTOList(userSubmissions));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/submit', validateSchema(submitAssessmentSchema), async (req, res) => {
  try {
    const dto = AssessmentMapper.toSubmitReqDTO(req.body);
    const submission = await assessmentUseCase.submitVideoLink(dto);
    res.status(201).json(AssessmentMapper.toResDTO(submission));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/grade', validateSchema(gradeAssessmentSchema), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid Assessment ObjectId' });
    }
    const dto = AssessmentMapper.toGradeReqDTO(req.body);
    const graded = await assessmentUseCase.gradeSubmission(req.params.id, dto);
    if (!graded) return res.status(404).json({ message: 'Assessment record not found' });
    res.json(AssessmentMapper.toResDTO(graded));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;