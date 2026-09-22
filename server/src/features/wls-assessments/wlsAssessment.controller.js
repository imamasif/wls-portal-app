import express from 'express';
import mongoose from 'mongoose';
import { assessmentUseCase } from './wlsAssessment.usecase.js';
import { AssessmentMapper } from './wlsAssessment.mapper.js';
import { submitAssessmentSchema, gradeAssessmentSchema } from './index.js';
import { validateSchema } from '../../common/middleware/validateSchema.js';
import { AssessmentModel } from './wlsAssessment.model.js';
import { WlsSessionModel } from '../wls-session/wlsSession.model.js'; // <-- Added missing model import

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

// Add this route near your other GET endpoints in wlsAssessment.controller_3.js
router.get('/session/:sessionId/user/:userId', async (req, res) => {
  try {
    const { sessionId, userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sessionId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid Session or User ObjectId' });
    }
    const assessment = await assessmentUseCase.getOrCreateAssessment(sessionId, userId);
    res.json(AssessmentMapper.toResDTO(assessment));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// STATIC ROUTES MUST COME BEFORE DYNAMIC /:id ROUTES
router.post('/submit', validateSchema(submitAssessmentSchema), async (req, res) => {
  try {
    const dto = AssessmentMapper.toSubmitReqDTO(req.body);
    const submission = await assessmentUseCase.submitVideoLink(dto);
    res.status(201).json(AssessmentMapper.toResDTO(submission));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:sessionId/submit-video', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId, videoUrl, userComments } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ error: 'Video URL is required.' });
    }

    const session = await WlsSessionModel.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'WLS Session not found.' });
    }

    if (!session.studentSubmissions) {
      session.studentSubmissions = new Map();
    }

    session.studentSubmissions.set(userId || 'anonymous', {
      userId,
      submissionUrl: videoUrl,
      userComments: userComments || '',
      submittedAt: new Date()
    });

    await session.save();

    res.status(200).json({
      success: true,
      message: 'Video submission recorded successfully.',
      data: session
    });
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

router.put('/:id/complete', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid Assessment ObjectId' });
    }
    const completed = await assessmentUseCase.markAsCompleted(req.params.id);
    if (!completed) return res.status(404).json({ message: 'Assessment record not found' });
    res.json(AssessmentMapper.toResDTO(completed));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/messages', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid Assessment ObjectId' });
    }
    
    const dto = AssessmentMapper.toMessageReqDTO(req.body);
    if (!dto.text || !dto.senderId) {
      return res.status(400).json({ error: 'Sender ID and text are required.' });
    }

    const updatedAssessment = await assessmentUseCase.addMessage(req.params.id, dto);
    if (!updatedAssessment) {
      return res.status(404).json({ message: 'Assessment record not found' });
    }

    res.json(AssessmentMapper.toResDTO(updatedAssessment));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;