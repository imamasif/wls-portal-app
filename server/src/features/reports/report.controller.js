import express from 'express';
import { reportUseCase } from './index.js';
import { UserAnalyticsResDTO, AssessmentAnalyticsResDTO, GroupReportResDTO } from './report.res.js';

const router = express.Router();

// GET /api/reports/users - User stats for pie/bar charts
router.get('/users', async (req, res) => {
  try {
    const analytics = await reportUseCase.getUserAnalytics();
    res.status(200).json(new UserAnalyticsResDTO(analytics));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/assessments - Assessment scores analytics
router.get('/assessments', async (req, res) => {
  try {
    const analytics = await reportUseCase.getAssessmentAnalytics();
    res.status(200).json(new AssessmentAnalyticsResDTO(analytics));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/groups - Reporting groups performance
router.get('/groups', async (req, res) => {
  try {
    const groups = await reportUseCase.getGroupPerformanceReports();
    const formattedGroups = groups.map((g) => new GroupReportResDTO(g));
    res.status(200).json(formattedGroups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;