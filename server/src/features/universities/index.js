// server/src/features/universities/index.js (or your university routes file)
import { Router } from "express";
import { UniversityController } from "./universities.controller.js";
import { CourseController } from "../courses/index.js"; // Adjust import path to your course exports

const router = Router();

export { UniversityModel } from "./universities.model.js";
export { createUniversityAjvSchema } from "./universities.schema.js";
export { UniversityController } from "./universities.controller.js";

// Support both endpoints to prevent 404 errors from the frontend
router.get("/university-summary", UniversityController.getUniversitySummary);
router.get("/portal-summary", UniversityController.getUniversitySummary);

router.get("/courses", CourseController.getAll);
router.post("/courses", CourseController.create);
router.post("/courses/:courseId/lectures", CourseController.addLectureToCourse);
router.delete(
  "/courses/:courseId/lectures/:lectureId",
  CourseController.deleteLecture,
);

export default router;
