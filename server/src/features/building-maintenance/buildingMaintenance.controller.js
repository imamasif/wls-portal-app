import fs from "fs";
import path from "path";
import { BuildingMaintenanceUseCase } from "./buildingMaintenance.usecase.js";
import { BuildingMaintenanceMapper } from "./buildingMaintenance.mapper.js";
import { BuildingMaintenanceModel } from "./buildingMaintenance.model.js";

export class BuildingMaintenanceController {
  /**
   * GET /by-date/:date
   */
  static async getReportByDate(req, res) {
    try {
      const { date } = req.params;
      const report = await BuildingMaintenanceUseCase.getReportByDate(date);
      return res.status(200).json({ success: true, report });
    } catch (err) {
      console.error("Error in getReportByDate:", err);
      return res.status(500).json({ error: err.message || "Failed to load report" });
    }
  }

  /**
   * POST /save-daily
   */
  static async saveDailyReport(req, res) {
    try {
      const dto = BuildingMaintenanceMapper.toSaveDailyReportReqDTO(req.body);
      const userId = req.user?._id || req.headers["x-user-id"] || null;
      const saved = await BuildingMaintenanceUseCase.saveDailyReport(dto, userId);
      return res.status(200).json({
        success: true,
        message: "Daily checklist saved successfully.",
        report: saved,
      });
    } catch (err) {
      console.error("Error in saveDailyReport:", err);
      return res.status(400).json({ error: err.message || "Failed to save daily report" });
    }
  }

  /**
   * GET /dates
   */
  static async getAllDates(req, res) {
    try {
      const dates = await BuildingMaintenanceUseCase.getAllReportDates();
      return res.status(200).json({ success: true, dates });
    } catch (err) {
      console.error("Error in getAllDates:", err);
      return res.status(500).json({ error: err.message || "Failed to load report dates" });
    }
  }

  /**
   * GET /template
   */
  static async getMasterTemplate(req, res) {
    try {
      const template = await BuildingMaintenanceUseCase.getMasterTemplate();
      return res.status(200).json({ success: true, template });
    } catch (err) {
      console.error("Error in getMasterTemplate:", err);
      return res.status(500).json({ error: err.message || "Failed to load master template" });
    }
  }

  /**
   * POST /areas
   */
  static async addArea(req, res) {
    try {
      const dto = BuildingMaintenanceMapper.toAddAreaReqDTO(req.body);
      const result = await BuildingMaintenanceUseCase.addArea(dto);
      return res.status(201).json(result);
    } catch (err) {
      console.error("Error in addArea:", err);
      return res.status(400).json({ error: err.message });
    }
  }

  /**
   * PUT /areas/:oldAreaName
   */
  static async renameArea(req, res) {
    try {
      const { oldAreaName } = req.params;
      const { newArea, reportDate } = req.body;
      const dto = BuildingMaintenanceMapper.toRenameAreaReqDTO({
        oldArea: decodeURIComponent(oldAreaName),
        newArea,
        reportDate,
      });
      const result = await BuildingMaintenanceUseCase.renameArea(dto);
      return res.status(200).json(result);
    } catch (err) {
      console.error("Error in renameArea:", err);
      return res.status(400).json({ error: err.message });
    }
  }

  /**
   * DELETE /areas/:areaName
   */
  static async deleteArea(req, res) {
    try {
      const { areaName } = req.params;
      const { reportDate } = req.query;
      const result = await BuildingMaintenanceUseCase.deleteArea({
        area: decodeURIComponent(areaName),
        reportDate,
      });
      return res.status(200).json(result);
    } catch (err) {
      console.error("Error in deleteArea:", err);
      return res.status(400).json({ error: err.message });
    }
  }

  /**
   * POST /tasks
   */
  static async addTask(req, res) {
    try {
      const dto = BuildingMaintenanceMapper.toAddTaskReqDTO(req.body);
      const result = await BuildingMaintenanceUseCase.addTask(dto);
      return res.status(201).json(result);
    } catch (err) {
      console.error("Error in addTask:", err);
      return res.status(400).json({ error: err.message });
    }
  }

  /**
   * PUT /tasks/:taskId
   */
  static async updateTask(req, res) {
    try {
      const { taskId } = req.params;
      const dto = BuildingMaintenanceMapper.toUpdateTaskReqDTO(req.body);
      const result = await BuildingMaintenanceUseCase.updateTask(taskId, dto, req.body.reportDate);
      return res.status(200).json(result);
    } catch (err) {
      console.error("Error in updateTask:", err);
      return res.status(400).json({ error: err.message });
    }
  }

  /**
   * DELETE /tasks/:taskId
   */
  static async deleteTask(req, res) {
    try {
      const { taskId } = req.params;
      const { reportDate } = req.query;
      const result = await BuildingMaintenanceUseCase.deleteTask(taskId, reportDate);
      return res.status(200).json(result);
    } catch (err) {
      console.error("Error in deleteTask:", err);
      return res.status(400).json({ error: err.message });
    }
  }

  /**
   * POST /:id/generate-pdf
   */
  static async generatePdf(req, res) {
    try {
      const { id } = req.params;
      const result = await BuildingMaintenanceUseCase.generatePdfReport(id);
      return res.status(200).json({
        success: true,
        message: "PDF report generated successfully.",
        ...result,
      });
    } catch (err) {
      console.error("Error in generatePdf:", err);
      return res.status(500).json({ error: err.message || "Failed to generate PDF report" });
    }
  }

  /**
   * POST /:id/upload-drive
   */
  static async uploadToDrive(req, res) {
    try {
      const { id } = req.params;
      const result = await BuildingMaintenanceUseCase.uploadReportToGoogleDrive(id);
      return res.status(200).json(result);
    } catch (err) {
      console.error("Error in uploadToDrive:", err);
      return res.status(500).json({ error: err.message || "Failed to upload to Google Drive" });
    }
  }

  /**
   * GET /download/:id/pdf
   */
  static async downloadPdf(req, res) {
    try {
      const { id } = req.params;
      const doc = await BuildingMaintenanceModel.findById(id);
      if (!doc) {
        return res.status(404).json({ error: "Report not found" });
      }

      let pdfPath = doc.pdfLocalPath;
      if (!pdfPath || !fs.existsSync(pdfPath)) {
        const gen = await BuildingMaintenanceUseCase.generatePdfReport(id);
        pdfPath = gen.pdfLocalPath;
      }

      const fileName = path.basename(pdfPath);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      const fileStream = fs.createReadStream(pdfPath);
      fileStream.pipe(res);
    } catch (err) {
      console.error("Error downloading PDF:", err);
      return res.status(500).json({ error: err.message || "Failed to download PDF" });
    }
  }
}
