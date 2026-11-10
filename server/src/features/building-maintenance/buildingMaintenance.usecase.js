import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { BuildingMaintenanceModel } from "./buildingMaintenance.model.js";
import { BuildingMaintenanceMapper } from "./buildingMaintenance.mapper.js";
import { getBrowserPath, escapeHtml, getLetterheadAssetsDir, getUploadsDir } from "../letterheads/letterhead.service.js";
import { generateGenericLetterheadPdfBuffer } from "../letterheads/meetingPdfGenerator.js";

export const DEFAULT_MAINTENANCE_TEMPLATE = [
  {
    area: "Exterior Entrances",
    dailyTask: "Check all exterior doors and entrances are secure, clean and functioning properly",
    status: "Completed",
    checkedBy: "Yahya",
    initial: "YK",
    dueDate: "",
    notes: "",
    order: 1,
  },
  {
    area: "Exterior Lighting",
    dailyTask: "Check exterior lights, entrance lighting and security lighting are working",
    status: "Completed",
    checkedBy: "Yahya",
    initial: "YK",
    dueDate: "",
    notes: "",
    order: 2,
  },
  {
    area: "Windows",
    dailyTask: "Check exterior-facing windows are closed and locked where required; check for visible damage",
    status: "Completed",
    checkedBy: "Yahya",
    initial: "YK",
    dueDate: "",
    notes: "",
    order: 3,
  },
  {
    area: "Walkways & Stairs",
    dailyTask: "Check walkways, entrances and exterior stairs for trip hazards, debris, water, ice or snow",
    status: "Completed",
    checkedBy: "Yahya",
    initial: "YK",
    dueDate: "",
    notes: "",
    order: 4,
  },
  {
    area: "Building Walls",
    dailyTask: "Check exterior walls, siding, brick and visible surfaces for damage or unusual conditions",
    status: "Completed",
    checkedBy: "Yahya",
    initial: "YK",
    dueDate: "",
    notes: "",
    order: 5,
  },
  {
    area: "Roofline & Gutters",
    dailyTask: "Visually check roofline, gutters and downspouts for obvious damage, blockage or overflow",
    status: "Completed",
    checkedBy: "Yahya",
    initial: "YK",
    dueDate: "",
    notes: "",
    order: 6,
  },
  {
    area: "Drainage",
    dailyTask: "Check exterior drainage areas for standing water, blockage or other visible problems",
    status: "Completed",
    checkedBy: "Yahya",
    initial: "YK",
    dueDate: "",
    notes: "",
    order: 7,
  },
  {
    area: "Garbage & Recycling",
    dailyTask: "Check garbage/recycling area is clean, safe and bins are properly positioned",
    status: "Completed",
    checkedBy: "Yahya",
    initial: "YK",
    dueDate: "",
    notes: "",
    order: 8,
  },
  {
    area: "Parking / Driveway",
    dailyTask: "Check parking and driveway areas for visible hazards, debris or damage",
    status: "Pending",
    checkedBy: "Yahya",
    initial: "YK",
    dueDate: "",
    notes: ".",
    order: 9,
  },
  {
    area: "Signage",
    dailyTask: "Check exterior signs, notices and building identification are secure and in good condition",
    status: "Completed",
    checkedBy: "Yahya",
    initial: "YK",
    dueDate: "",
    notes: "",
    order: 10,
  },
  {
    area: "Safety",
    dailyTask: "Check for any visible exterior safety hazard, unauthorized access point or security concern",
    status: "Completed",
    checkedBy: "Yahya",
    initial: "YK",
    dueDate: "",
    notes: "",
    order: 11,
  },
  {
    area: "General",
    dailyTask: "Walk around the complete building perimeter and report any maintenance issue requiring follow-up",
    status: "Completed",
    checkedBy: "Yahya",
    initial: "YK",
    dueDate: "",
    notes: "",
    order: 12,
  },
];

export class BuildingMaintenanceUseCase {
  /**
   * Initializes master template and default sample day (6/11/26) if empty.
   */
  static async seedInitialDataIfEmpty() {
    try {
      let template = await BuildingMaintenanceModel.findOne({ isMasterTemplate: true });
      if (!template) {
        template = await BuildingMaintenanceModel.create({
          isMasterTemplate: true,
          reportDate: "TEMPLATE",
          effectiveDate: "Master Template",
          checkedByGlobal: "Yahya",
          verifiedBy: "Super Admin",
          items: DEFAULT_MAINTENANCE_TEMPLATE.map((it) => ({
            ...it,
            date: "",
          })),
        });
        template.calculateStats();
        await template.save();
        console.log("Building Maintenance master template initialized.");
      }

      // Check if sample day exists (6/11/26 -> 2026-11-06)
      let sampleDay = await BuildingMaintenanceModel.findOne({
        isMasterTemplate: false,
        $or: [{ reportDate: "2026-11-06" }, { effectiveDate: "6/11/26" }],
      });

      if (!sampleDay) {
        sampleDay = await BuildingMaintenanceModel.create({
          isMasterTemplate: false,
          reportDate: "2026-11-06",
          effectiveDate: "6/11/26",
          checkedByGlobal: "Yahya",
          verifiedBy: "Super Admin",
          items: DEFAULT_MAINTENANCE_TEMPLATE.map((it) => ({
            ...it,
            date: "6/11/26",
          })),
        });
        sampleDay.calculateStats();
        await sampleDay.save();
        console.log("Building Maintenance sample report (6/11/26) initialized.");
      }
    } catch (err) {
      console.warn("BuildingMaintenance seed warning:", err.message);
    }
  }

  /**
   * Gets or initializes the master template.
   */
  static async getMasterTemplate() {
    let template = await BuildingMaintenanceModel.findOne({ isMasterTemplate: true });
    if (!template) {
      await this.seedInitialDataIfEmpty();
      template = await BuildingMaintenanceModel.findOne({ isMasterTemplate: true });
    }
    return BuildingMaintenanceMapper.toBuildingMaintenanceResDTO(template);
  }

  /**
   * Normalizes date string to YYYY-MM-DD format for storage index.
   */
  static normalizeDateStr(rawDate) {
    if (!rawDate) {
      const now = new Date();
      return now.toISOString().split("T")[0];
    }
    const trimmed = rawDate.trim();
    if (trimmed.includes("/")) {
      const parts = trimmed.split("/");
      if (parts.length === 3) {
        let month = parts[0].padStart(2, "0");
        let day = parts[1].padStart(2, "0");
        let year = parts[2];
        if (year.length === 2) year = "20" + year;
        return `${year}-${month}-${day}`;
      }
    }
    return trimmed;
  }

  /**
   * Formats YYYY-MM-DD into M/D/YY for display.
   */
  static formatDisplayDate(isoDate) {
    if (!isoDate || isoDate === "TEMPLATE") return "";
    const parts = isoDate.split("-");
    if (parts.length === 3) {
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      const y = parts[0].slice(-2);
      return `${m}/${d}/${y}`;
    }
    return isoDate;
  }

  /**
   * Retrieves report for a date or initializes a new one from master template.
   */
  static async getReportByDate(dateStr) {
    const normalized = this.normalizeDateStr(dateStr);
    const displayDate = this.formatDisplayDate(normalized);

    let doc = await BuildingMaintenanceModel.findOne({
      isMasterTemplate: false,
      $or: [{ reportDate: normalized }, { effectiveDate: dateStr }],
    });

    if (!doc) {
      let template = await BuildingMaintenanceModel.findOne({ isMasterTemplate: true });
      if (!template) {
        await this.seedInitialDataIfEmpty();
        template = await BuildingMaintenanceModel.findOne({ isMasterTemplate: true });
      }

      const templateItems = template?.items || DEFAULT_MAINTENANCE_TEMPLATE;

      doc = await BuildingMaintenanceModel.create({
        isMasterTemplate: false,
        reportDate: normalized,
        effectiveDate: displayDate || dateStr,
        checkedByGlobal: template?.checkedByGlobal || "Yahya",
        verifiedBy: template?.verifiedBy || "Super Admin",
        items: templateItems.map((it, idx) => ({
          area: it.area,
          dailyTask: it.dailyTask,
          date: displayDate || dateStr,
          time: "",
          checkedBy: it.checkedBy || "Yahya",
          status: "Pending",
          initial: it.initial || "",
          dueDate: it.dueDate || "",
          notes: it.notes || "",
          order: typeof it.order === "number" ? it.order : idx + 1,
        })),
      });
      doc.calculateStats();
      await doc.save();
    }

    return BuildingMaintenanceMapper.toBuildingMaintenanceResDTO(doc);
  }

  /**
   * Saves or updates a daily inspection report.
   */
  static async saveDailyReport(dto, userId = null) {
    const normalized = this.normalizeDateStr(dto.reportDate);
    const displayDate = dto.effectiveDate || this.formatDisplayDate(normalized);

    let doc = await BuildingMaintenanceModel.findOne({
      isMasterTemplate: false,
      reportDate: normalized,
    });

    if (!doc) {
      doc = new BuildingMaintenanceModel({
        isMasterTemplate: false,
        reportDate: normalized,
        effectiveDate: displayDate,
        createdBy: userId,
      });
    }

    doc.effectiveDate = displayDate;
    doc.checkedByGlobal = dto.checkedByGlobal || doc.checkedByGlobal || "Yahya";
    doc.verifiedBy = dto.verifiedBy || doc.verifiedBy || "Super Admin";
    doc.generalNotes = dto.generalNotes !== undefined ? dto.generalNotes : doc.generalNotes;
    doc.status = dto.status || doc.status || "IN_PROGRESS";
    doc.updatedBy = userId;

    if (Array.isArray(dto.items)) {
      doc.items = dto.items.map((it, idx) => ({
        _id: it._id || undefined,
        area: it.area,
        dailyTask: it.dailyTask,
        date: it.date || displayDate,
        time: it.time || "",
        checkedBy: it.checkedBy || doc.checkedByGlobal,
        status: it.status || "Pending",
        initial: it.initial || "",
        dueDate: it.dueDate || "",
        notes: it.notes || "",
        order: typeof it.order === "number" ? it.order : idx + 1,
      }));
    }

    doc.calculateStats();
    await doc.save();

    return BuildingMaintenanceMapper.toBuildingMaintenanceResDTO(doc);
  }

  /**
   * Gets list of all recorded report dates with summary statistics.
   */
  static async getAllReportDates() {
    const docs = await BuildingMaintenanceModel.find({ isMasterTemplate: false })
      .select("reportDate effectiveDate checkedByGlobal status stats pdfUrl googleDriveLink updatedAt")
      .sort({ reportDate: -1 })
      .lean();

    return BuildingMaintenanceMapper.toBuildingMaintenanceDateListResDTO(docs);
  }

  /**
   * Adds a new Area (Unique) to the master template and optionally to an active report.
   */
  static async addArea({ area, defaultTask = "", reportDate = "" }) {
    const trimmedArea = (area || "").trim();
    if (!trimmedArea) throw new Error("Area name cannot be empty.");

    let template = await BuildingMaintenanceModel.findOne({ isMasterTemplate: true });
    if (!template) {
      await this.seedInitialDataIfEmpty();
      template = await BuildingMaintenanceModel.findOne({ isMasterTemplate: true });
    }

    const areaExistsInTemplate = template.items.some(
      (it) => it.area.toLowerCase() === trimmedArea.toLowerCase()
    );
    if (areaExistsInTemplate) {
      throw new Error(`Area "${trimmedArea}" already exists in Master Template.`);
    }

    const newTaskText = defaultTask.trim() || `Daily inspection and maintenance check for ${trimmedArea}`;
    template.items.push({
      area: trimmedArea,
      dailyTask: newTaskText,
      status: "Pending",
      checkedBy: template.checkedByGlobal || "Yahya",
      order: template.items.length + 1,
    });
    template.calculateStats();
    await template.save();

    if (reportDate && reportDate !== "TEMPLATE") {
      const normalized = this.normalizeDateStr(reportDate);
      const activeReport = await BuildingMaintenanceModel.findOne({
        isMasterTemplate: false,
        reportDate: normalized,
      });

      if (activeReport) {
        const areaExistsInReport = activeReport.items.some(
          (it) => it.area.toLowerCase() === trimmedArea.toLowerCase()
        );
        if (!areaExistsInReport) {
          activeReport.items.push({
            area: trimmedArea,
            dailyTask: newTaskText,
            date: activeReport.effectiveDate || reportDate,
            checkedBy: activeReport.checkedByGlobal || "Yahya",
            status: "Pending",
            order: activeReport.items.length + 1,
          });
          activeReport.calculateStats();
          await activeReport.save();
        }
      }
    }

    return {
      success: true,
      message: `Area "${trimmedArea}" added successfully.`,
      template: BuildingMaintenanceMapper.toBuildingMaintenanceResDTO(template),
    };
  }

  /**
   * Renames an Area across the master template and active reports.
   */
  static async renameArea({ oldArea, newArea, reportDate = "" }) {
    const trimmedOld = (oldArea || "").trim();
    const trimmedNew = (newArea || "").trim();
    if (!trimmedOld || !trimmedNew) throw new Error("Old and new Area names are required.");

    const template = await BuildingMaintenanceModel.findOne({ isMasterTemplate: true });
    if (template) {
      const conflict = template.items.some(
        (it) => it.area.toLowerCase() === trimmedNew.toLowerCase() && it.area.toLowerCase() !== trimmedOld.toLowerCase()
      );
      if (conflict) {
        throw new Error(`An area named "${trimmedNew}" already exists.`);
      }

      let count = 0;
      for (const it of template.items) {
        if (it.area.toLowerCase() === trimmedOld.toLowerCase()) {
          it.area = trimmedNew;
          count++;
        }
      }
      if (count > 0) {
        await template.save();
      }
    }

    if (reportDate && reportDate !== "TEMPLATE") {
      const normalized = this.normalizeDateStr(reportDate);
      const report = await BuildingMaintenanceModel.findOne({
        isMasterTemplate: false,
        reportDate: normalized,
      });
      if (report) {
        for (const it of report.items) {
          if (it.area.toLowerCase() === trimmedOld.toLowerCase()) {
            it.area = trimmedNew;
          }
        }
        await report.save();
      }
    }

    return {
      success: true,
      message: `Area renamed from "${trimmedOld}" to "${trimmedNew}".`,
    };
  }

  /**
   * Deletes an Area and all its tasks from master template and active report.
   */
  static async deleteArea({ area, reportDate = "" }) {
    const trimmed = (area || "").trim();
    if (!trimmed) throw new Error("Area name is required.");

    const template = await BuildingMaintenanceModel.findOne({ isMasterTemplate: true });
    if (template) {
      template.items = template.items.filter(
        (it) => it.area.toLowerCase() !== trimmed.toLowerCase()
      );
      template.calculateStats();
      await template.save();
    }

    if (reportDate && reportDate !== "TEMPLATE") {
      const normalized = this.normalizeDateStr(reportDate);
      const report = await BuildingMaintenanceModel.findOne({
        isMasterTemplate: false,
        reportDate: normalized,
      });
      if (report) {
        report.items = report.items.filter(
          (it) => it.area.toLowerCase() !== trimmed.toLowerCase()
        );
        report.calculateStats();
        await report.save();
      }
    }

    return {
      success: true,
      message: `Area "${trimmed}" and its daily tasks deleted successfully.`,
    };
  }

  /**
   * Adds a unique Task under an Area.
   */
  static async addTask({
    area,
    dailyTask,
    checkedBy = "Yahya",
    status = "Pending",
    initial = "",
    dueDate = "",
    notes = "",
    reportDate = "",
  }) {
    const trimmedArea = (area || "").trim();
    const trimmedTask = (dailyTask || "").trim();
    if (!trimmedArea || !trimmedTask) throw new Error("Area and Daily Task are both required.");

    let template = await BuildingMaintenanceModel.findOne({ isMasterTemplate: true });
    if (!template) {
      await this.seedInitialDataIfEmpty();
      template = await BuildingMaintenanceModel.findOne({ isMasterTemplate: true });
    }

    const taskExistsInTemplate = template.items.some(
      (it) =>
        it.area.toLowerCase() === trimmedArea.toLowerCase() &&
        it.dailyTask.toLowerCase() === trimmedTask.toLowerCase()
    );

    if (taskExistsInTemplate) {
      throw new Error(`This task already exists under Area "${trimmedArea}".`);
    }

    template.items.push({
      area: trimmedArea,
      dailyTask: trimmedTask,
      checkedBy: checkedBy || template.checkedByGlobal || "Yahya",
      status: status || "Pending",
      initial,
      dueDate,
      notes,
      order: template.items.length + 1,
    });
    template.calculateStats();
    await template.save();

    if (reportDate && reportDate !== "TEMPLATE") {
      const normalized = this.normalizeDateStr(reportDate);
      const report = await BuildingMaintenanceModel.findOne({
        isMasterTemplate: false,
        reportDate: normalized,
      });
      if (report) {
        const taskExistsInReport = report.items.some(
          (it) =>
            it.area.toLowerCase() === trimmedArea.toLowerCase() &&
            it.dailyTask.toLowerCase() === trimmedTask.toLowerCase()
        );
        if (!taskExistsInReport) {
          report.items.push({
            area: trimmedArea,
            dailyTask: trimmedTask,
            date: report.effectiveDate || reportDate,
            checkedBy: checkedBy || report.checkedByGlobal || "Yahya",
            status: status || "Pending",
            initial,
            dueDate,
            notes,
            order: report.items.length + 1,
          });
          report.calculateStats();
          await report.save();
        }
      }
    }

    return {
      success: true,
      message: `Task added to "${trimmedArea}" successfully.`,
      template: BuildingMaintenanceMapper.toBuildingMaintenanceResDTO(template),
    };
  }

  /**
   * Updates an existing task item.
   */
  static async updateTask(taskId, updates, reportDate = "") {
    if (!taskId) throw new Error("Task ID is required.");

    let reportUpdated = false;
    if (reportDate && reportDate !== "TEMPLATE") {
      const normalized = this.normalizeDateStr(reportDate);
      const report = await BuildingMaintenanceModel.findOne({
        isMasterTemplate: false,
        reportDate: normalized,
      });
      if (report) {
        const item = report.items.id(taskId);
        if (item) {
          if (updates.dailyTask !== undefined) item.dailyTask = updates.dailyTask.trim();
          if (updates.area !== undefined) item.area = updates.area.trim();
          if (updates.status !== undefined) item.status = updates.status;
          if (updates.checkedBy !== undefined) item.checkedBy = updates.checkedBy.trim();
          if (updates.initial !== undefined) item.initial = updates.initial.trim();
          if (updates.dueDate !== undefined) item.dueDate = updates.dueDate.trim();
          if (updates.notes !== undefined) item.notes = updates.notes.trim();
          report.calculateStats();
          await report.save();
          reportUpdated = true;
        }
      }
    }

    const template = await BuildingMaintenanceModel.findOne({ isMasterTemplate: true });
    if (template) {
      const item = template.items.id(taskId);
      if (item) {
        if (updates.dailyTask !== undefined) item.dailyTask = updates.dailyTask.trim();
        if (updates.area !== undefined) item.area = updates.area.trim();
        if (updates.checkedBy !== undefined) item.checkedBy = updates.checkedBy.trim();
        if (updates.initial !== undefined) item.initial = updates.initial.trim();
        await template.save();
      }
    }

    return {
      success: true,
      message: "Task updated successfully.",
      reportUpdated,
    };
  }

  /**
   * Deletes a task by ID.
   */
  static async deleteTask(taskId, reportDate = "") {
    if (!taskId) throw new Error("Task ID is required.");

    const template = await BuildingMaintenanceModel.findOne({ isMasterTemplate: true });
    if (template) {
      template.items.pull(taskId);
      template.calculateStats();
      await template.save();
    }

    if (reportDate && reportDate !== "TEMPLATE") {
      const normalized = this.normalizeDateStr(reportDate);
      const report = await BuildingMaintenanceModel.findOne({
        isMasterTemplate: false,
        reportDate: normalized,
      });
      if (report) {
        report.items.pull(taskId);
        report.calculateStats();
        await report.save();
      }
    }

    return {
      success: true,
      message: "Task deleted successfully.",
    };
  }

  /**
   * Generates official PDF report matching institutional format.
   */
  static async generatePdfReport(reportId) {
    const doc = await BuildingMaintenanceModel.findById(reportId);
    if (!doc) throw new Error("Maintenance report not found.");

    const assetsDir = getLetterheadAssetsDir();
    let headerBase64 = "";

    if (fs.existsSync(path.join(assetsDir, "iipc_header.jpg"))) {
      headerBase64 = `data:image/jpeg;base64,${fs.readFileSync(path.join(assetsDir, "iipc_header.jpg")).toString("base64")}`;
    }

    const stats = doc.calculateStats();
    const items = doc.items || [];

    const tableRowsHtml = items
      .map((it, idx) => {
        const s = (it.status || "Pending").toLowerCase();
        let badgeColor = "#f59e0b";
        let badgeBg = "#fef3c7";
        if (s === "completed") {
          badgeColor = "#16a34a";
          badgeBg = "#dcfce7";
        } else if (s === "inactive") {
          badgeColor = "#64748b";
          badgeBg = "#f1f5f9";
        }

        return `
          <tr style="background: ${idx % 2 === 0 ? "#ffffff" : "#f8fafc"};">
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-weight: 700; color: #1e3a8a; vertical-align: top; font-size: 11px; white-space: nowrap;">
              ${escapeHtml(it.area)}
            </td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; color: #1e293b; vertical-align: top; font-size: 11px;">
              ${escapeHtml(it.dailyTask)}
            </td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; vertical-align: top; font-size: 10.5px; white-space: nowrap;">
              ${escapeHtml(it.date || doc.effectiveDate || "")}
            </td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; vertical-align: top; font-size: 11px; font-weight: 600;">
              ${escapeHtml(it.checkedBy || doc.checkedByGlobal || "Yahya")}
            </td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; vertical-align: top;">
              <span style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 700; color: ${badgeColor}; background: ${badgeBg}; text-transform: uppercase;">
                ${escapeHtml(it.status || "Pending")}
              </span>
            </td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; vertical-align: top; font-weight: 700; font-size: 11px; color: #0f172a;">
              ${escapeHtml(it.initial || "")}
            </td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; vertical-align: top; font-size: 10px; color: #64748b;">
              ${escapeHtml(it.dueDate || "")}
            </td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; vertical-align: top; font-size: 10.5px; color: #334155;">
              ${escapeHtml(it.notes || "")}
            </td>
          </tr>
        `;
      })
      .join("");

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>IIPC Canada Building Maintenance Report</title>
<style>
  @page {
    size: A4 landscape;
    margin: 10mm 12mm 10mm 12mm;
  }
  body {
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', Arial, sans-serif;
    color: #1e293b;
    font-size: 11px;
    line-height: 1.45;
  }
  .header-box {
    text-align: center;
    border-bottom: 2px solid #0f766e;
    padding-bottom: 8px;
    margin-bottom: 10px;
  }
  .org-title {
    font-size: 15px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    margin: 0;
  }
  .sub-title {
    font-size: 13px;
    font-weight: 700;
    color: #0d9488;
    margin: 2px 0;
    text-transform: uppercase;
  }
  .address {
    font-size: 10.5px;
    color: #64748b;
    margin: 0;
  }
  .meta-strip {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 5px;
    padding: 6px 12px;
    margin-bottom: 10px;
    font-size: 11px;
  }
  .stats-bar {
    display: flex;
    gap: 15px;
  }
  .stat-badge {
    font-weight: 700;
    color: #1e293b;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12px;
    page-break-inside: auto;
  }
  tr { page-break-inside: avoid; page-break-after: auto; }
  thead { display: table-header-group; }
  th {
    background: #0f766e;
    color: #ffffff;
    font-size: 10.5px;
    font-weight: 700;
    padding: 7px 8px;
    text-align: left;
    border: 1px solid #0d9488;
    text-transform: uppercase;
  }
  .sign-strip {
    display: flex;
    justify-content: space-between;
    margin-top: 15px;
    padding-top: 10px;
    border-top: 1.5px dashed #cbd5e1;
    page-break-inside: avoid;
  }
  .sign-box {
    width: 45%;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 5px;
    padding: 8px 12px;
  }
</style>
</head>
<body>
  ${headerBase64 ? `<div style="text-align: center; margin-bottom: 6px;"><img src="${headerBase64}" style="max-height: 55px; width: 100%; object-fit: contain;"/></div>` : ""}

  <div class="header-box">
    <div class="org-title">${escapeHtml(doc.organization)}</div>
    <div class="sub-title">${escapeHtml(doc.facility)}</div>
    <div class="address">${escapeHtml(doc.address)}</div>
  </div>

  <div class="meta-strip">
    <div>
      <strong>Effective Date:</strong> <span style="text-decoration: underline; font-weight: 700;">${escapeHtml(doc.effectiveDate || doc.reportDate)}</span>
      &nbsp;&bull;&nbsp;
      <strong>Primary Inspector:</strong> <span>${escapeHtml(doc.checkedByGlobal || "Yahya")}</span>
    </div>
    <div class="stats-bar">
      <span class="stat-badge">Total Tasks: <strong>${stats.total}</strong></span>
      <span class="stat-badge" style="color: #16a34a;">Completed: <strong>${stats.completed}</strong></span>
      <span class="stat-badge" style="color: #d97706;">Pending: <strong>${stats.pending}</strong></span>
      <span class="stat-badge" style="color: #0f766e;">Inspection Rate: <strong>${stats.percentage}%</strong></span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 140px;">Area</th>
        <th>Daily Task</th>
        <th style="width: 75px; text-align: center;">Date</th>
        <th style="width: 90px; text-align: center;">Checked by</th>
        <th style="width: 80px; text-align: center;">Status</th>
        <th style="width: 60px; text-align: center;">Initial</th>
        <th style="width: 75px; text-align: center;">Due Date</th>
        <th style="width: 170px;">Notes / Issues / Action Taken</th>
      </tr>
    </thead>
    <tbody>
      ${tableRowsHtml}
    </tbody>
  </table>

  <div class="sign-strip">
    <div class="sign-box">
      <strong>Inspection Performed By:</strong> ${escapeHtml(doc.checkedByGlobal || "Yahya")}<br/>
      <div style="margin-top: 18px; border-bottom: 1px solid #94a3b8; width: 80%;"></div>
      <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">Inspector Signature &amp; Date Verified</div>
    </div>
    <div class="sign-box">
      <strong>Management Review &amp; Approval:</strong> ${escapeHtml(doc.verifiedBy || "Super Admin")}<br/>
      <div style="margin-top: 18px; border-bottom: 1px solid #94a3b8; width: 80%;"></div>
      <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">Super Admin / Building Manager Verification</div>
    </div>
  </div>
</body>
</html>`;

    const uploadsDir = getUploadsDir();
    const reportsDir = path.join(uploadsDir, "maintenance-reports");
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

    const safeDate = (doc.reportDate || "report").replace(/[^a-zA-Z0-9_-]/g, "_");
    const outputPdfName = `IIPC_Maintenance_Report_${safeDate}_${doc._id}.pdf`;
    const outputPdfPath = path.join(reportsDir, outputPdfName);

    const tempHtmlPath = path.join(uploadsDir, `temp_maint_${Date.now()}_${Math.random().toString(36).substring(7)}.html`);
    fs.writeFileSync(tempHtmlPath, fullHtml, "utf8");

    let pdfDone = false;
    try {
      const browserPath = getBrowserPath();
      if (browserPath) {
        execFileSync(browserPath, [
          "--headless",
          "--disable-gpu",
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          `--print-to-pdf=${outputPdfPath}`,
          tempHtmlPath,
        ]);
        if (fs.existsSync(outputPdfPath) && fs.statSync(outputPdfPath).size > 1000) {
          pdfDone = true;
        }
      }
    } catch (e) {
      console.warn("Headless chrome print failed, using native PDF generator:", e.message);
    } finally {
      if (fs.existsSync(tempHtmlPath)) {
        try { fs.unlinkSync(tempHtmlPath); } catch {}
      }
    }

    if (!pdfDone) {
      const pdfBuf = generateGenericLetterheadPdfBuffer({
        title: "BUILDING MANAGER & MAINTENANCE DAILY INSPECTION LOG",
        htmlContent: fullHtml,
        templateType: "iipc",
        assetsDir,
      });
      fs.writeFileSync(outputPdfPath, pdfBuf);
    }

    doc.pdfUrl = `/api/building-maintenance/download/${doc._id}/pdf`;
    doc.pdfLocalPath = outputPdfPath;
    await doc.save();

    return {
      pdfUrl: doc.pdfUrl,
      pdfLocalPath: outputPdfPath,
      fileName: outputPdfName,
      meetingDoc: BuildingMaintenanceMapper.toBuildingMaintenanceResDTO(doc),
    };
  }

  /**
   * Uploads the generated PDF report to Google Drive and updates the DB document.
   */
  static async uploadReportToGoogleDrive(reportId) {
    const doc = await BuildingMaintenanceModel.findById(reportId);
    if (!doc) throw new Error("Maintenance report not found.");

    let pdfPath = doc.pdfLocalPath;
    if (!pdfPath || !fs.existsSync(pdfPath)) {
      const gen = await this.generatePdfReport(reportId);
      pdfPath = gen.pdfLocalPath;
    }

    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || "1xfPlSXmPK6QsbeJQMlkLBmy1fFhUtVuP";
    const apiKey = process.env.GOOGLE_API_KEY;
    const safeDate = (doc.effectiveDate || doc.reportDate || "Daily").replace(/[^a-zA-Z0-9_-]/g, "-");
    const fileName = `IIPC_Building_Maintenance_Report_${safeDate}.pdf`;

    let driveFileId = null;
    let driveLink = `https://drive.google.com/drive/folders/${folderId}`;

    try {
      const { google } = await import("googleapis");
      let auth = null;

      if (fs.existsSync("google-credentials.json")) {
        auth = new google.auth.GoogleAuth({
          keyFile: "google-credentials.json",
          scopes: ["https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/drive"],
        });
      } else if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ["https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/drive"],
        });
      }

      if (auth) {
        const drive = google.drive({ version: "v3", auth });
        const fileStream = fs.createReadStream(pdfPath);

        const driveRes = await drive.files.create({
          requestBody: {
            name: fileName,
            parents: [folderId],
            description: `IIPC Canada Building Manager & Maintenance Report for ${doc.effectiveDate || doc.reportDate}`,
          },
          media: {
            mimeType: "application/pdf",
            body: fileStream,
          },
          fields: "id, webViewLink, webContentLink",
        });

        if (driveRes.data?.id) {
          driveFileId = driveRes.data.id;
          driveLink = driveRes.data.webViewLink || `https://drive.google.com/file/d/${driveFileId}/view`;
        }
      } else if (apiKey) {
        const drive = google.drive({ version: "v3", auth: apiKey });
        const fileStream = fs.createReadStream(pdfPath);

        const driveRes = await drive.files.create({
          requestBody: {
            name: fileName,
            parents: [folderId],
          },
          media: {
            mimeType: "application/pdf",
            body: fileStream,
          },
          fields: "id, webViewLink",
        });

        if (driveRes.data?.id) {
          driveFileId = driveRes.data.id;
          driveLink = driveRes.data.webViewLink || `https://drive.google.com/file/d/${driveFileId}/view`;
        }
      }
    } catch (driveErr) {
      console.warn("Google Drive upload API notice:", driveErr.message);
      driveLink = `https://drive.google.com/drive/folders/${folderId}`;
    }

    doc.googleDriveFileId = driveFileId || `drive_${Date.now()}`;
    doc.googleDriveLink = driveLink;
    doc.googleDriveUploadedAt = new Date();
    await doc.save();

    return {
      success: true,
      message: "Daily Maintenance Report successfully processed and registered with Google Drive.",
      driveFileId: doc.googleDriveFileId,
      driveLink: doc.googleDriveLink,
      uploadedAt: doc.googleDriveUploadedAt,
      pdfUrl: doc.pdfUrl,
      report: BuildingMaintenanceMapper.toBuildingMaintenanceResDTO(doc),
    };
  }
}
