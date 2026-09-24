import { Router } from "express";
import { UniversityController } from "./universities.controller.js";

const router = Router();

export { UniversityModel } from "./universities.model.js";
export { createUniversityAjvSchema } from "./universities.schema.js";
export { UniversityController } from "./universities.controller.js";

// Endpoint for Super User / Admin portal summary
router.get("/university-summary", UniversityController.getUniversitySummary);

export default router;
