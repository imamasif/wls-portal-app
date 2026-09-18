import express from 'express';
import mongoose from 'mongoose';
import { WlsReportingUseCase } from './wlsReporting.usecase.js';
import { WlsReportingMapper } from './wlsReporting.mapper.js';

const router = express.Router();

router.get('/analytics-report', async (req, res) => {
  try {
    const reportData = await WlsReportingUseCase.getAnalyticsReport();
    res.json({
      success: true,
      ...reportData
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const data = await WlsReportingUseCase.getAllReports();
    res.json(WlsReportingMapper.toResDTOList(data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ error: 'Invalid User ObjectId' });
    }
    const userSubmissions = await WlsReportingUseCase.getUserReports(req.params.userId);
    res.json(WlsReportingMapper.toResDTOList(userSubmissions));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/submit', async (req, res) => {
  try {
    const dto = WlsReportingMapper.toSubmitReqDTO(req.body);
    const submission = await WlsReportingUseCase.submitReportRecord(dto);
    res.status(201).json(WlsReportingMapper.toResDTO(submission));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/grade', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ObjectId' });
    }
    const dto = WlsReportingMapper.toGradeReqDTO(req.body);
    const graded = await WlsReportingUseCase.gradeReportRecord(req.params.id, dto);
    if (!graded) return res.status(404).json({ message: 'Record not found' });
    res.json(WlsReportingMapper.toResDTO(graded));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/complete', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ObjectId' });
    }
    const completed = await WlsReportingUseCase.markAsCompleted(req.params.id);
    if (!completed) return res.status(404).json({ message: 'Record not found' });
    res.json(WlsReportingMapper.toResDTO(completed));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;