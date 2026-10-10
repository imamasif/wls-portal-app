import express from "express";
import { ReportService } from "./report.service.js";
import { WlsSessionModel } from "../wls-session/wlsSession.model.js";

const router = express.Router();

/**
 * GET /api/reports/analytics-report
 * Queries real MongoDB data with optional filters:
 * ?sessionId=...&userId=...&role=...&groupNumber=...
 */
router.get("/analytics-report", async (req, res) => {
  try {
    const { sessionId, userId, role, groupNumber } = req.query;
    const reportData = await ReportService.getAnalyticsReport({
      sessionId,
      userId,
      role,
      groupNumber,
    });
    return res.status(200).json(reportData);
  } catch (err) {
    console.error("Error generating analytics report:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to generate report from live database",
      details: err.message,
    });
  }
});

/**
 * GET /api/reports/sessions
 * Helper endpoint returning all sessions for dropdown filters
 */
router.get("/sessions", async (req, res) => {
  try {
    const sessions = await WlsSessionModel.find()
      .sort({ sessionDateTimeToronto: -1 })
      .lean();
    return res.status(200).json({ success: true, sessions });
  } catch (err) {
    console.error("Error fetching report sessions:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
