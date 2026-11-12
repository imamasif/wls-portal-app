import { UniversityUseCase } from "./university.usecase.js";
import {
  UniversityMapper,
  DepartmentMapper,
  BatchMapper,
  SemesterMapper,
  CourseMapper,
  LectureMapper,
  EnrollmentMapper,
  ProgressMapper,
  CertificateMapper,
  MessageMapper,
} from "./university.mapper.js";
import {
  CreateUniversityReqDTO,
  CreateDepartmentReqDTO,
  CreateBatchReqDTO,
  CreateSemesterReqDTO,
  CreateCourseReqDTO,
  CreateLectureReqDTO,
  EnrollStudentReqDTO,
  UpdateProgressReqDTO,
  SubmitExamAttemptReqDTO,
  AwardCertificateReqDTO,
  SendMessageReqDTO,
} from "./university.req.js";

export class UniversityController {
  static async syncWebCurriculum(req, res, next) {
    try {
      const { populateCurriculumFromWeb } = await import("../../../scripts/populate_clean_curriculum.js");
      const summary = await populateCurriculumFromWeb();
      res.status(200).json({
        success: true,
        message: "Clean web curriculum successfully populated from IIPC Canada portal!",
        data: summary,
      });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // 1. UNIVERSITY PROFILE
  // =========================================================================
  static async getUniversity(req, res, next) {
    try {
      const uni = await UniversityUseCase.getOrCreateUniversity();
      res.status(200).json({ success: true, data: UniversityMapper.toDTO(uni) });
    } catch (err) {
      next(err);
    }
  }

  static async updateUniversity(req, res, next) {
    try {
      const reqDto = new CreateUniversityReqDTO(req.body);
      const updated = await UniversityUseCase.updateUniversity(req.params.id, reqDto);
      res.status(200).json({ success: true, data: UniversityMapper.toDTO(updated) });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // 2. DEPARTMENTS
  // =========================================================================
  static async listDepartments(req, res, next) {
    try {
      const depts = await UniversityUseCase.listDepartments(req.query.universityId);
      res.status(200).json({ success: true, data: DepartmentMapper.toDTOList(depts) });
    } catch (err) {
      next(err);
    }
  }

  static async createDepartment(req, res, next) {
    try {
      const reqDto = new CreateDepartmentReqDTO(req.body);
      const dept = await UniversityUseCase.createDepartment(reqDto);
      res.status(201).json({ success: true, data: DepartmentMapper.toDTO(dept) });
    } catch (err) {
      next(err);
    }
  }

  static async updateDepartment(req, res, next) {
    try {
      const dept = await UniversityUseCase.updateDepartment(req.params.id, req.body);
      res.status(200).json({ success: true, data: DepartmentMapper.toDTO(dept) });
    } catch (err) {
      next(err);
    }
  }

  static async checkDepartmentDeletion(req, res, next) {
    try {
      const eligibility = await UniversityUseCase.checkDepartmentDeletionEligibility(req.params.id);
      res.status(200).json({ success: true, data: eligibility });
    } catch (err) {
      next(err);
    }
  }

  static async deleteDepartment(req, res, next) {
    try {
      const dept = await UniversityUseCase.deleteDepartment(req.params.id);
      res.status(200).json({ success: true, message: "Department deleted successfully", data: dept });
    } catch (err) {
      next(err);
    }
  }

  static async getUniversityAnalyticsReport(req, res, next) {
    try {
      const report = await UniversityUseCase.getUniversityAnalyticsReport(req.query);
      res.status(200).json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }


  // =========================================================================
  // 2b. BATCHES (YEAR COHORTS)
  // =========================================================================
  static async listBatches(req, res, next) {
    try {
      const batches = await UniversityUseCase.listBatches(req.query);
      res.status(200).json({ success: true, data: BatchMapper.toDTOList(batches) });
    } catch (err) {
      next(err);
    }
  }

  static async createBatch(req, res, next) {
    try {
      const reqDto = new CreateBatchReqDTO(req.body);
      const batch = await UniversityUseCase.createBatch(reqDto);
      res.status(201).json({ success: true, data: BatchMapper.toDTO(batch) });
    } catch (err) {
      next(err);
    }
  }

  static async updateBatch(req, res, next) {
    try {
      const batch = await UniversityUseCase.updateBatch(req.params.id, req.body);
      res.status(200).json({ success: true, data: BatchMapper.toDTO(batch) });
    } catch (err) {
      next(err);
    }
  }

  static async deleteBatch(req, res, next) {
    try {
      const result = await UniversityUseCase.deleteBatch(req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // 3. SEMESTERS
  // =========================================================================
  static async listSemesters(req, res, next) {
    try {
      const deptId = req.params.departmentId || req.query.departmentId;
      const semesters = await UniversityUseCase.listSemesters(deptId);
      res.status(200).json({ success: true, data: SemesterMapper.toDTOList(semesters) });
    } catch (err) {
      next(err);
    }
  }

  static async createSemester(req, res, next) {
    try {
      const reqDto = new CreateSemesterReqDTO(req.body);
      const sem = await UniversityUseCase.createSemester(reqDto);
      res.status(201).json({ success: true, data: SemesterMapper.toDTO(sem) });
    } catch (err) {
      next(err);
    }
  }

  static async updateSemester(req, res, next) {
    try {
      const sem = await UniversityUseCase.updateSemester(req.params.id, req.body);
      res.status(200).json({ success: true, data: SemesterMapper.toDTO(sem) });
    } catch (err) {
      next(err);
    }
  }

  static async deleteSemester(req, res, next) {
    try {
      const sem = await UniversityUseCase.deleteSemester(req.params.id);
      res.status(200).json({ success: true, message: "Semester deleted successfully", data: sem });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // 4. COURSES
  // =========================================================================
  static async listCourses(req, res, next) {
    try {
      const filter = {
        departmentId: req.query.departmentId,
        semesterId: req.query.semesterId,
        instructorId: req.query.instructorId,
      };
      const courses = await UniversityUseCase.listCourses(filter);
      res.status(200).json({ success: true, data: CourseMapper.toDTOList(courses) });
    } catch (err) {
      next(err);
    }
  }

  static async getCourseById(req, res, next) {
    try {
      const course = await UniversityUseCase.getCourseById(req.params.id);
      res.status(200).json({ success: true, data: CourseMapper.toDTO(course) });
    } catch (err) {
      next(err);
    }
  }

  static async createCourse(req, res, next) {
    try {
      const reqDto = new CreateCourseReqDTO(req.body);
      const course = await UniversityUseCase.createCourse(reqDto);
      res.status(201).json({ success: true, data: CourseMapper.toDTO(course) });
    } catch (err) {
      next(err);
    }
  }

  static async updateCourse(req, res, next) {
    try {
      const course = await UniversityUseCase.updateCourse(req.params.id, req.body);
      res.status(200).json({ success: true, data: CourseMapper.toDTO(course) });
    } catch (err) {
      next(err);
    }
  }

  static async toggleCourseActive(req, res, next) {
    try {
      const course = await UniversityUseCase.toggleCourseActive(
        req.params.id,
        req.body.isActive
      );
      res.status(200).json({ success: true, data: CourseMapper.toDTO(course) });
    } catch (err) {
      next(err);
    }
  }

  static async toggleExamAvailability(req, res, next) {
    try {
      const { isExamAvailable } = req.body;
      const course = await UniversityUseCase.toggleExamAvailability(req.params.id, isExamAvailable);
      res.status(200).json({
        success: true,
        message: `Exam availability set to ${isExamAvailable}`,
        data: CourseMapper.toDTO(course),
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteCourse(req, res, next) {
    try {
      const course = await UniversityUseCase.deleteCourse(req.params.id);
      res.status(200).json({ success: true, message: "Course deleted successfully", data: course });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // 5. LECTURES
  // =========================================================================
  static async listLectures(req, res, next) {
    try {
      const lectures = await UniversityUseCase.listLectures(req.params.courseId);
      res.status(200).json({ success: true, data: LectureMapper.toDTOList(lectures) });
    } catch (err) {
      next(err);
    }
  }

  static async createLecture(req, res, next) {
    try {
      const courseId = req.params.courseId || req.body.courseId;
      const reqDto = new CreateLectureReqDTO({ ...req.body, courseId });
      const lecture = await UniversityUseCase.createLecture(reqDto);
      res.status(201).json({ success: true, data: LectureMapper.toDTO(lecture) });
    } catch (err) {
      next(err);
    }
  }

  static async updateLecture(req, res, next) {
    try {
      const lecture = await UniversityUseCase.updateLecture(req.params.id, req.body);
      res.status(200).json({ success: true, data: LectureMapper.toDTO(lecture) });
    } catch (err) {
      next(err);
    }
  }

  static async deleteLecture(req, res, next) {
    try {
      const lecture = await UniversityUseCase.deleteLecture(req.params.id);
      res.status(200).json({ success: true, message: "Lecture deleted successfully", data: lecture });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // 6. ENROLLMENTS & ROLL NUMBERS
  // =========================================================================
  static async batchEnrollStudents(req, res, next) {
    try {
      const result = await UniversityUseCase.batchEnrollStudents(req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async quickCreateAndEnrollStudent(req, res, next) {
    try {
      const result = await UniversityUseCase.quickCreateAndEnrollStudent(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async updateEnrollmentStatus(req, res, next) {
    try {
      const enrollment = await UniversityUseCase.updateEnrollmentStatus(req.params.id, req.body.status);
      res.status(200).json({ success: true, data: enrollment });
    } catch (err) {
      next(err);
    }
  }

  static async deleteEnrollment(req, res, next) {
    try {
      const result = await UniversityUseCase.deleteEnrollment(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async listEnrollments(req, res, next) {
    try {
      const enrollments = await UniversityUseCase.listEnrollments({
        departmentId: req.query.departmentId,
        studentId: req.query.studentId,
        status: req.query.status,
      });
      res.status(200).json({ success: true, data: EnrollmentMapper.toDTOList(enrollments) });
    } catch (err) {
      next(err);
    }
  }

  static async enrollStudent(req, res, next) {
    try {
      const reqDto = new EnrollStudentReqDTO(req.body);
      const enrollment = await UniversityUseCase.enrollStudent(reqDto);
      res.status(201).json({ success: true, data: EnrollmentMapper.toDTO(enrollment) });
    } catch (err) {
      next(err);
    }
  }

  static async promoteStudent(req, res, next) {
    try {
      const { studentId, departmentId } = req.body;
      const result = await UniversityUseCase.promoteStudent(studentId, departmentId);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async bulkPromoteBatch(req, res, next) {
    try {
      const { batchId, batchYear, departmentId, currentSemesterNumber, dryRun } = req.body;
      const result = await UniversityUseCase.bulkPromoteBatch({
        batchId,
        batchYear,
        departmentId,
        currentSemesterNumber: Number(currentSemesterNumber) || 1,
        dryRun: dryRun === true || dryRun === "true",
      });
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // 7. STUDENT PROGRESS & ANTI-CHEAT VIDEO WATCHING
  // =========================================================================
  static async getStudentCourseProgress(req, res, next) {
    try {
      const { studentId, courseId } = req.params;
      const result = await UniversityUseCase.getStudentCourseProgress(studentId, courseId);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async updateLectureWatchProgress(req, res, next) {
    try {
      const reqDto = new UpdateProgressReqDTO(req.body);
      const progress = await UniversityUseCase.updateLectureWatchProgress(reqDto);
      res.status(200).json({ success: true, data: ProgressMapper.toDTO(progress) });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // 8. EXAM ATTEMPTS
  // =========================================================================
  static async submitExamAttempt(req, res, next) {
    try {
      const reqDto = new SubmitExamAttemptReqDTO(req.body);
      const attempt = await UniversityUseCase.submitExamAttempt(reqDto);
      res.status(200).json({ success: true, data: attempt });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // 9. CERTIFICATES
  // =========================================================================
  static async listCertificates(req, res, next) {
    try {
      const certs = await UniversityUseCase.listCertificates({
        studentId: req.query.studentId,
        departmentId: req.query.departmentId,
      });
      res.status(200).json({ success: true, data: CertificateMapper.toDTOList(certs) });
    } catch (err) {
      next(err);
    }
  }

  static async awardCertificate(req, res, next) {
    try {
      const reqDto = new AwardCertificateReqDTO(req.body);
      const cert = await UniversityUseCase.awardCertificate(reqDto);
      res.status(201).json({ success: true, data: CertificateMapper.toDTO(cert) });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // 10. 1-ON-1 MESSAGING (Student <-> Instructor)
  // =========================================================================
  static async getMessages(req, res, next) {
    try {
      const { courseId, studentId } = req.params;
      const msgs = await UniversityUseCase.getMessages(courseId, studentId);
      res.status(200).json({ success: true, data: MessageMapper.toDTOList(msgs) });
    } catch (err) {
      next(err);
    }
  }

  static async sendMessage(req, res, next) {
    try {
      const reqDto = new SendMessageReqDTO(req.body);
      const msg = await UniversityUseCase.sendMessage(reqDto);
      res.status(201).json({ success: true, data: MessageMapper.toDTO(msg) });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // 11. PORTAL SUMMARY
  // =========================================================================
  static async getPortalSummary(req, res, next) {
    try {
      const summary = await UniversityUseCase.getPortalSummary();
      res.status(200).json({ success: true, data: summary });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // 12. REORDER LECTURES (Drag & Drop)
  // =========================================================================
  static async reorderLectures(req, res, next) {
    try {
      const { courseId } = req.params;
      const { orderedLectureIds } = req.body;
      const lectures = await UniversityUseCase.reorderLectures(courseId, orderedLectureIds);
      res.status(200).json({ success: true, data: LectureMapper.toDTOList(lectures) });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // 13. COURSE AUDIT & TRACKING
  // =========================================================================
  static async getCourseAudit(req, res, next) {
    try {
      const { courseId } = req.params;
      const audit = await UniversityUseCase.getCourseAudit(courseId);
      res.status(200).json({ success: true, data: audit });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // 14. LECTURE NOTES
  // =========================================================================
  static async saveLectureNote(req, res, next) {
    try {
      const { studentId, courseId, lectureId, text, timestampSeconds } = req.body;
      const note = await UniversityUseCase.saveLectureNote(
        studentId,
        courseId,
        lectureId,
        text,
        timestampSeconds
      );
      res.status(201).json({ success: true, data: note });
    } catch (err) {
      next(err);
    }
  }

  static async getLectureNotes(req, res, next) {
    try {
      const { studentId, lectureId } = req.params;
      const notes = await UniversityUseCase.getLectureNotes(studentId, lectureId);
      res.status(200).json({ success: true, data: notes });
    } catch (err) {
      next(err);
    }
  }

}
