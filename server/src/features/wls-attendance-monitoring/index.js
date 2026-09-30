import express from "express";
import mongoose from "mongoose";
import { attendanceUseCase } from "./wlsAttMon.usecase.js";
import { AttendanceMapper } from "./wlsAttMon.mapper.js";
import {
  toggleAttendanceSchema,
  markAttendanceSchema,
} from "./wlsAttMon.schema.js";
import { validateSchema } from "../../common/middleware/validateSchema.js";
import { WlsSessionModel } from "../wls-session/wlsSession.model.js";

const router = express.Router();

// Get session attendance status & config
router.get("/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ error: "Invalid Session ObjectId" });
    }
    const session = await WlsSessionModel.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });

    const config = await attendanceUseCase.getOrCreateConfig(sessionId);
    res.json(AttendanceMapper.toSessionStatusResDTO(config, session));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin/SuperUser: Open or Close Attendance
router.post(
  "/toggle",
  validateSchema(toggleAttendanceSchema),
  async (req, res) => {
    try {
      const dto = AttendanceMapper.toToggleReqDTO(req.body);
      const updatedConfig = await attendanceUseCase.toggleAttendance(dto);
      res.json({ success: true, data: updatedConfig });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// User: Click "I AM ATTENDING"
router.post("/mark", validateSchema(markAttendanceSchema), async (req, res) => {
  try {
    const dto = AttendanceMapper.toMarkReqDTO(req.body);
    const record = await attendanceUseCase.markAttendance(dto);
    res
      .status(201)
      .json({
        success: true,
        message: "Attendance marked successfully!",
        data: AttendanceMapper.toRecordResDTO(record),
      });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get comprehensive attendance report (Present & Absent list) for a session
router.get("/report/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ error: "Invalid Session ObjectId" });
    }
    const report = await attendanceUseCase.getAttendanceReport(sessionId);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
