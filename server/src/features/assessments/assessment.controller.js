import express from 'express';
import mongoose from 'mongoose';
import { assessmentUseCase } from './index.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const data = await assessmentUseCase.getAllAssessments();
    res.json(data);
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
    res.json(userSubmissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/evaluator/:evaluatorId', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.evaluatorId)) {
      return res.status(400).json({ error: 'Invalid Evaluator ObjectId' });
    }
    const queue = await assessmentUseCase.getEvaluatorQueue(req.params.evaluatorId);
    res.json(queue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/submit', async (req, res) => {
  try {
    const { sessionId, userId, videoUrl } = req.body;
    if (!mongoose.Types.ObjectId.isValid(sessionId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid Session or User ObjectId' });
    }
    const submission = await assessmentUseCase.submitVideoLink(sessionId, userId, videoUrl);
    res.status(201).json(submission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/grade', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid Assessment ObjectId' });
    }
    const { evaluatorId, marks, feedbackComments } = req.body;
    const graded = await assessmentUseCase.gradeSubmission(req.params.id, evaluatorId, marks, feedbackComments);
    if (!graded) return res.status(404).json({ message: 'Assessment record not found' });
    res.json(graded);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;