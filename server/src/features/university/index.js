import { Router } from "express";
import { UniversityController } from "./university.controller.js";

const router = Router();

// Re-exports for clean module imports
export {
  UniversityModel,
  DepartmentModel,
  BatchModel,
  SemesterModel,
  CourseModel,
  LectureModel,
  StudentEnrollmentModel,
  StudentLectureProgressModel,
  StudentExamAttemptModel,
  CertificateModel,
  UniversityMessageModel,
} from "./university.model.js";

export { UniversityController } from "./university.controller.js";
export { UniversityUseCase } from "./university.usecase.js";

// =========================================================================
// ROUTES MAPPING
// =========================================================================

// Portal Summary / Dashboard
router.post("/sync-web-curriculum", UniversityController.syncWebCurriculum);
router.get("/portal-summary", UniversityController.getPortalSummary);
router.get("/university-summary", UniversityController.getPortalSummary);

// University Profile
router.get("/", UniversityController.getUniversity);
router.put("/:id", UniversityController.updateUniversity);

// Batches (Year Cohorts)
router.get("/batches", UniversityController.listBatches);
router.post("/batches", UniversityController.createBatch);
router.put("/batches/:id", UniversityController.updateBatch);
router.delete("/batches/:id", UniversityController.deleteBatch);

// Departments
router.get("/departments", UniversityController.listDepartments);
router.post("/departments", UniversityController.createDepartment);
router.put("/departments/:id", UniversityController.updateDepartment);
router.get("/departments/:id/deletion-eligibility", UniversityController.checkDepartmentDeletion);
router.delete("/departments/:id", UniversityController.deleteDepartment);
router.get("/analytics-report", UniversityController.getUniversityAnalyticsReport);

// Semesters
router.get("/departments/:departmentId/semesters", UniversityController.listSemesters);
router.get("/semesters", UniversityController.listSemesters);
router.post("/semesters", UniversityController.createSemester);
router.put("/semesters/:id", UniversityController.updateSemester);
router.delete("/semesters/:id", UniversityController.deleteSemester);

// Courses
router.get("/courses", UniversityController.listCourses);
router.get("/courses/:id", UniversityController.getCourseById);
router.post("/courses", UniversityController.createCourse);
router.put("/courses/:id", UniversityController.updateCourse);
router.patch("/courses/:id/toggle-exam", UniversityController.toggleExamAvailability);
router.patch("/courses/:id/toggle-active", UniversityController.toggleCourseActive);
router.delete("/courses/:id", UniversityController.deleteCourse);

// Course Lectures
router.get("/courses/:courseId/lectures", UniversityController.listLectures);
router.post("/courses/:courseId/lectures", UniversityController.createLecture);
router.put("/lectures/:id", UniversityController.updateLecture);
router.delete("/lectures/:id", UniversityController.deleteLecture);
router.delete("/courses/:courseId/lectures/:lectureId", (req, res, next) => {
  req.params.id = req.params.lectureId;
  return UniversityController.deleteLecture(req, res, next);
});

// Enrollments & Roll Numbers
router.get("/enrollments", UniversityController.listEnrollments);
router.post("/enrollments", UniversityController.enrollStudent);
router.post("/enrollments/batch", UniversityController.batchEnrollStudents);
router.post("/enrollments/quick-create-and-enroll", UniversityController.quickCreateAndEnrollStudent);
router.patch("/enrollments/:id/status", UniversityController.updateEnrollmentStatus);
router.delete("/enrollments/:id", UniversityController.deleteEnrollment);
router.post("/enrollments/promote", UniversityController.promoteStudent);
router.post("/batches/bulk-promote", UniversityController.bulkPromoteBatch);
router.post("/enrollments/bulk-promote", UniversityController.bulkPromoteBatch);

// Student Watch Progress & Anti-Cheat
router.get("/progress/student/:studentId/course/:courseId", UniversityController.getStudentCourseProgress);
router.post("/progress/watch", UniversityController.updateLectureWatchProgress);
router.post("/course-progress/lecture-progress", UniversityController.updateLectureWatchProgress); // backward compatibility

// Exams
router.post("/exams/submit", UniversityController.submitExamAttempt);

// Certificates
router.get("/certificates", UniversityController.listCertificates);
router.post("/certificates/award", UniversityController.awardCertificate);

// Direct 1-on-1 Messaging
router.get("/messages/:courseId/student/:studentId", UniversityController.getMessages);
router.post("/messages", UniversityController.sendMessage);


// Reorder lectures (drag & drop)
router.patch("/courses/:courseId/reorder-lectures", UniversityController.reorderLectures);

// Course audit & student progress tracking
router.get("/courses/:courseId/audit", UniversityController.getCourseAudit);
router.get("/course-audit/:courseId", UniversityController.getCourseAudit);

// Lecture notes
router.post("/progress/note", UniversityController.saveLectureNote);
router.get("/progress/notes/:studentId/:lectureId", UniversityController.getLectureNotes);

export default router;
