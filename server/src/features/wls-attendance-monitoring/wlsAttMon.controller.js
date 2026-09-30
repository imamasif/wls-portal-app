import mongoose from "mongoose";
import {
  AttendanceRecordModel,
  AttendanceConfigModel,
} from "./wlsAttMon.model.js";
import { WlsSessionModel } from "../wls-session/wlsSession.model.js";
import { AttendanceMapper } from "./wlsAttMon.mapper.js";

export class AttendanceController {
  static async getSessionStatus(req, res) {
    try {
      const { sessionId } = req.params;
      const config = await AttendanceUseCase.getOrCreateConfig(sessionId);
      return res.status(200).json(config);
    } catch (error) {
      console.error("ERROR in getSessionStatus:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async toggleAttendance(req, res) {
    try {
      const config = await AttendanceUseCase.toggleAttendance(req.body);
      return res.status(200).json(config);
    } catch (error) {
      console.error("ERROR in toggleAttendance:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async markAttendance(req, res) {
    try {
      const record = await AttendanceUseCase.markAttendance(req.body);
      return res.status(200).json(record);
    } catch (error) {
      console.error("ERROR in markAttendance:", error);
      return res.status(400).json({ error: error.message });
    }
  }

  static async getAttendanceReport(req, res) {
    try {
      const { sessionId } = req.params;
      const report = await AttendanceUseCase.getAttendanceReport(sessionId);
      return res.status(200).json(report);
    } catch (error) {
      console.error("ERROR in getAttendanceReport:", error);
      return res.status(500).json({ error: error.message });
    }
  }
}
