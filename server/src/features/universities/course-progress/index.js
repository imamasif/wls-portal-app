// server/src/features/universities/course-progress/index.js
import { Router } from "express";
import { CourseProgressController } from "./courseProgress.controller.js";

const router = Router();

export {
  CourseProgressModel,
  StudentCourseProgressModel,
} from "./courseProgress.model.js";
export { courseProgressAjvSchema } from "./courseProgress.schema.js";
export { CourseProgressController } from "./courseProgress.controller.js";

router.get(
  "/student-course/:studentId/:courseId",
  CourseProgressController.getStudentView,
);
router.post("/lecture-progress", CourseProgressController.updateProgress);
router.get(
  "/audit/course/:courseId",
  CourseProgressController.getSuperUserAudit,
);

export default router;
