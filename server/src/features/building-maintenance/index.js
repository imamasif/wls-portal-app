import express from "express";
import { BuildingMaintenanceController } from "./buildingMaintenance.controller.js";
import { validateSchema } from "../../common/middleware/validateSchema.js";
import {
  saveDailyReportSchema,
  addAreaSchema,
  renameAreaSchema,
  addTaskSchema,
  updateTaskSchema,
} from "./buildingMaintenance.schema.js";

const router = express.Router();

// Middleware: restrict to SUPER_USER or WLS_ADMIN
function requireSuperUser(req, res, next) {
  const role = (
    req.headers["x-user-role"] ||
    req.headers["role"] ||
    req.body?.userRole ||
    req.query?.userRole ||
    req.user?.role ||
    ""
  ).toUpperCase();

  if (
    role === "SUPER_USER" ||
    role === "UNIVERSITY_SUPER_USER" ||
    role.includes("SUPER") ||
    role === "WLS_ADMIN"
  ) {
    return next();
  }

  if (
    req.user &&
    (req.user.role === "SUPER_USER" ||
      req.user.role === "university_super_user" ||
      req.user.role === "WLS_ADMIN")
  ) {
    return next();
  }

  return res.status(403).json({
    error: "Access Denied: Only Super Users are authorized to access Building Maintenance.",
  });
}

// All maintenance operations require Super User / WLS Admin authorization
router.use(requireSuperUser);

// 1. Daily Inspection & Report Operations
router.get("/by-date/:date", BuildingMaintenanceController.getReportByDate);
router.post(
  "/save-daily",
  validateSchema(saveDailyReportSchema),
  BuildingMaintenanceController.saveDailyReport
);
router.get("/dates", BuildingMaintenanceController.getAllDates);
router.get("/template", BuildingMaintenanceController.getMasterTemplate);

// 2. Area Management (Create, Edit/Rename, Delete - Unique)
router.post("/areas", validateSchema(addAreaSchema), BuildingMaintenanceController.addArea);
router.put(
  "/areas/:oldAreaName",
  validateSchema(renameAreaSchema),
  BuildingMaintenanceController.renameArea
);
router.delete("/areas/:areaName", BuildingMaintenanceController.deleteArea);

// 3. Task Management under Area (Create, Edit, Delete - Unique under Area)
router.post("/tasks", validateSchema(addTaskSchema), BuildingMaintenanceController.addTask);
router.put(
  "/tasks/:taskId",
  validateSchema(updateTaskSchema),
  BuildingMaintenanceController.updateTask
);
router.delete("/tasks/:taskId", BuildingMaintenanceController.deleteTask);

// 4. PDF Generation & Google Drive Upload
router.post("/:id/generate-pdf", BuildingMaintenanceController.generatePdf);
router.post("/:id/upload-drive", BuildingMaintenanceController.uploadToDrive);
router.get("/download/:id/pdf", BuildingMaintenanceController.downloadPdf);

export default router;
export { BuildingMaintenanceController };
export * from "./buildingMaintenance.model.js";
export * from "./buildingMaintenance.usecase.js";
export * from "./buildingMaintenance.mapper.js";
export * from "./buildingMaintenance.req.js";
export * from "./buildingMaintenance.res.js";
export * from "./buildingMaintenance.schema.js";
