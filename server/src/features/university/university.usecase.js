import { syncUniversityCurriculum } from "./seedCurriculum.js";
import mongoose from "mongoose";
import {
  UniversityModel,
  DepartmentModel,
  SemesterModel,
  CourseModel,
  LectureModel,
  StudentEnrollmentModel,
  StudentLectureProgressModel,
  StudentExamAttemptModel,
  CertificateModel,
  UniversityMessageModel,
} from "./university.model.js";
import { UserModel } from "../users/user.model.js";
import { QuizModel } from "../quizzes/quiz.model.js";

export class UniversityUseCase {
  // =========================================================================
  // 1. UNIVERSITY PROFILE & SETUP
  // =========================================================================
  static async getOrCreateUniversity() {
    let uni = await UniversityModel.findOne({ isActive: true });
    if (!uni) {
      uni = await UniversityModel.create({
        name: "International Islamic Propagation Center (IIPC) University",
        code: "IIPC-U",
        description:
          "Systematic Quranic, Arabic, and Islamic Studies University offering undergraduate and certificate tracks.",
        foundedYear: 2026,
        address: "Canada",
        contactEmail: "info@iipc.ca",
        isActive: true,
      });

      // Seed a starter Department if none exist
      const deptCount = await DepartmentModel.countDocuments();
      if (deptCount === 0) {
        const qaDept = await DepartmentModel.create({
          universityId: uni._id,
          name: "Quranic Arabic & Translation",
          code: "QA",
          description: "Department of Quranic Language, Grammar, and Recitation Studies",
          totalSemesters: 8,
          headOfDepartment: "Mohammad Shaikh",
          isActive: true,
        });

        // Seed Semester 1
        const sem1 = await SemesterModel.create({
          universityId: uni._id,
          departmentId: qaDept._id,
          semesterNumber: 1,
          title: "Semester 1 - Foundation & Fundamentals",
          academicYear: "2026-2027",
          isActive: true,
        });

        // Seed Sample Course
        await CourseModel.create({
          universityId: uni._id,
          departmentId: qaDept._id,
          semesterId: sem1._id,
          title: "Introduction to Quranic Recitation & Meanings",
          code: "QA-101",
          description: "Fundamental lectures and word analysis of Quranic verses",
          credits: 3,
          isExamAvailable: true,
          examPassingPercentage: 70,
          examMaxAttempts: 3,
          isActive: true,
        });
      }
    }
    await syncUniversityCurriculum();
    return uni;
  }

  static async updateUniversity(id, payload) {
    const uni = await UniversityModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
    if (!uni) throw new Error("University not found");
    return uni;
  }

  // =========================================================================
  // 2. DEPARTMENTS
  // =========================================================================
  static async listDepartments(universityId) {
    const query = { isActive: true };
    if (universityId) query.universityId = universityId;
    return await DepartmentModel.find(query).sort({ name: 1 });
  }

  static async createDepartment(payload) {
    let uniId = payload.universityId;
    if (!uniId) {
      const defaultUni = await this.getOrCreateUniversity();
      uniId = defaultUni._id;
    }
    const cleanCode = (payload.code || "").trim().toUpperCase();
    const existing = await DepartmentModel.findOne({
      universityId: uniId,
      code: cleanCode,
    });
    if (existing) {
      throw new Error(`Department with code ${cleanCode} already exists in this university.`);
    }

    const dept = await DepartmentModel.create({
      ...payload,
      universityId: uniId,
      code: cleanCode,
    });

    // Auto-create Semesters 1 to totalSemesters (default 8)
    const totalSem = Number(payload.totalSemesters) || 8;
    const semesterDocs = [];
    for (let i = 1; i <= totalSem; i++) {
      semesterDocs.push({
        universityId: uniId,
        departmentId: dept._id,
        semesterNumber: i,
        title: `Semester ${i}`,
        academicYear: "2026-2027",
        isActive: true,
      });
    }
    await SemesterModel.insertMany(semesterDocs);

    return dept;
  }

  static async updateDepartment(id, payload) {
    const dept = await DepartmentModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
    if (!dept) throw new Error("Department not found");
    return dept;
  }

  static async deleteDepartment(id) {
    const coursesCount = await CourseModel.countDocuments({ departmentId: id });
    if (coursesCount > 0) {
      throw new Error("Cannot delete department that contains active courses. Delete or reassign courses first.");
    }
    await SemesterModel.deleteMany({ departmentId: id });
    const dept = await DepartmentModel.findByIdAndDelete(id);
    if (!dept) throw new Error("Department not found");
    return dept;
  }

  // =========================================================================
  // 3. SEMESTERS
  // =========================================================================
  static async listSemesters(departmentId) {
    const query = { isActive: true };
    if (departmentId) query.departmentId = departmentId;
    return await SemesterModel.find(query).sort({ semesterNumber: 1 });
  }

  static async createSemester(payload) {
    const sem = await SemesterModel.create(payload);
    return sem;
  }

  static async updateSemester(id, payload) {
    const sem = await SemesterModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
    if (!sem) throw new Error("Semester not found");
    return sem;
  }

  static async deleteSemester(id) {
    const courseCount = await CourseModel.countDocuments({ semesterId: id });
    if (courseCount > 0) {
      throw new Error("Cannot delete semester that contains active courses.");
    }
    const sem = await SemesterModel.findByIdAndDelete(id);
    if (!sem) throw new Error("Semester not found");
    return sem;
  }

  // =========================================================================
  // 4. COURSES
  // =========================================================================
  static async listCourses(filter = {}) {
    const query = { isActive: true };
    if (filter.departmentId) query.departmentId = filter.departmentId;
    if (filter.semesterId) query.semesterId = filter.semesterId;
    if (filter.instructorId) query.instructorId = filter.instructorId;

    return await CourseModel.find(query)
      .populate("departmentId", "name code")
      .populate("semesterId", "semesterNumber title")
      .populate("examQuizId", "title questions isPublished")
      .sort({ code: 1 });
  }

  static async getCourseById(id) {
    const course = await CourseModel.findById(id)
      .populate("departmentId", "name code")
      .populate("semesterId", "semesterNumber title")
      .populate("examQuizId", "title description questions isPublished");
    if (!course) throw new Error("Course not found");
    return course;
  }

  static async createCourse(payload) {
    let uniId = payload.universityId;
    if (!uniId) {
      const defaultUni = await this.getOrCreateUniversity();
      uniId = defaultUni._id;
    }

    const cleanCode = (payload.code || "").trim().toUpperCase();
    const existing = await CourseModel.findOne({
      departmentId: payload.departmentId,
      code: cleanCode,
    });
    if (existing) {
      throw new Error(`Course with code ${cleanCode} already exists in this department.`);
    }

    const course = await CourseModel.create({
      ...payload,
      universityId: uniId,
      code: cleanCode,
    });
    return course;
  }

  static async updateCourse(id, payload) {
    const course = await CourseModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
    if (!course) throw new Error("Course not found");
    return course;
  }

  static async toggleExamAvailability(id, isExamAvailable) {
    const course = await CourseModel.findByIdAndUpdate(
      id,
      { isExamAvailable: Boolean(isExamAvailable) },
      { new: true }
    );
    if (!course) throw new Error("Course not found");
    return course;
  }

  static async deleteCourse(id) {
    await LectureModel.deleteMany({ courseId: id });
    const course = await CourseModel.findByIdAndDelete(id);
    if (!course) throw new Error("Course not found");
    return course;
  }

  // =========================================================================
  // 5. LECTURES & SEQUENTIAL CURRICULA
  // =========================================================================
  static async listLectures(courseId) {
    return await LectureModel.find({ courseId, isActive: true }).sort({ order: 1 });
  }

  static async createLecture(payload) {
    if (!payload.order) {
      const highest = await LectureModel.findOne({ courseId: payload.courseId }).sort({ order: -1 });
      payload.order = highest ? highest.order + 1 : 1;
    }
    const lecture = await LectureModel.create(payload);
    return lecture;
  }

  static async updateLecture(id, payload) {
    const lecture = await LectureModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
    if (!lecture) throw new Error("Lecture not found");
    return lecture;
  }

  static async deleteLecture(id) {
    const lecture = await LectureModel.findByIdAndDelete(id);
    if (!lecture) throw new Error("Lecture not found");
    return lecture;
  }

  // =========================================================================
  // 6. STUDENT ENROLLMENT & ROLL NUMBER GENERATION
  // =========================================================================
  static async generateRollNumber(departmentCode, year = new Date().getFullYear()) {
    const prefix = `${year}-${departmentCode.toUpperCase()}-`;
    const count = await StudentEnrollmentModel.countDocuments({
      rollNumber: { $regex: `^${prefix}` },
    });
    const nextSeq = count + 1;
    return `${prefix}${String(nextSeq).padStart(3, "0")}`;
  }

  static async enrollStudent({ studentId, departmentId, semesterId, customRollNumber }) {
    const student = await UserModel.findById(studentId);
    if (!student) throw new Error("User not found to enroll.");

    const dept = await DepartmentModel.findById(departmentId);
    if (!dept) throw new Error("Department not found.");

    let targetSemester = null;
    if (semesterId) {
      targetSemester = await SemesterModel.findById(semesterId);
    }
    if (!targetSemester) {
      targetSemester = await SemesterModel.findOne({
        departmentId: dept._id,
        semesterNumber: 1,
      });
    }

    const existing = await StudentEnrollmentModel.findOne({
      studentId: student._id,
      departmentId: dept._id,
    });
    if (existing) {
      throw new Error(`Student ${student.name} is already enrolled in department ${dept.name} with Roll Number: ${existing.rollNumber}`);
    }

    const rollNumber =
      customRollNumber?.trim()?.toUpperCase() ||
      (await this.generateRollNumber(dept.code));

    const uni = await this.getOrCreateUniversity();

    const enrollment = await StudentEnrollmentModel.create({
      studentId: student._id,
      studentName: student.name,
      studentEmail: student.email,
      universityId: uni._id,
      departmentId: dept._id,
      currentSemesterId: targetSemester._id,
      currentSemesterNumber: targetSemester.semesterNumber || 1,
      rollNumber,
      status: "ACTIVE",
    });

    // Ensure student has university_student role in roles array
    if (!student.roles) student.roles = [];
    if (!student.roles.includes("university_student")) {
      student.roles.push("university_student");
      await student.save();
    }

    return enrollment;
  }

  static async listEnrollments(filter = {}) {
    const query = {};
    if (filter.departmentId) query.departmentId = filter.departmentId;
    if (filter.studentId) query.studentId = filter.studentId;
    if (filter.status) query.status = filter.status;

    return await StudentEnrollmentModel.find(query)
      .populate("studentId", "name email role")
      .populate("departmentId", "name code")
      .populate("currentSemesterId", "semesterNumber title")
      .sort({ createdAt: -1 });
  }

  // =========================================================================
  // 7. STUDENT LECTURE WATCH TRACKING & SEQUENTIAL PROGRESS
  // =========================================================================
  static async getStudentCourseProgress(studentId, courseId) {
    const course = await CourseModel.findById(courseId)
      .populate("departmentId", "name code")
      .populate("semesterId", "semesterNumber title")
      .populate("examQuizId", "title isPublished");
    if (!course) throw new Error("Course not found");

    const lectures = await LectureModel.find({ courseId, isActive: true }).sort({ order: 1 });
    const progressList = await StudentLectureProgressModel.find({
      studentId,
      courseId,
    });

    const progressMap = new Map();
    progressList.forEach((p) => progressMap.set(p.lectureId.toString(), p));

    let allPreviousMandatoryCompleted = true;

    const lecturesWithStatus = lectures.map((lec, idx) => {
      const p = progressMap.get(lec._id.toString());
      const isCompleted = p ? Boolean(p.isCompleted) : false;
      const watchedSeconds = p ? p.watchedSeconds : 0;
      const totalDurationSeconds = p ? p.totalDurationSeconds : lec.durationSeconds || 0;
      const lastPositionSeconds = p ? p.lastPositionSeconds : 0;

      // Sequential unlock rule:
      // A lecture is unlocked if:
      // 1. It is the very first lecture (idx === 0)
      // 2. OR all previous mandatory lectures are completed
      // 3. Optional lectures do not block subsequent lectures
      const isUnlocked = idx === 0 || allPreviousMandatoryCompleted || !lec.isMandatory;

      // Update mandatory chain for future lectures
      if (lec.isMandatory && !isCompleted) {
        allPreviousMandatoryCompleted = false;
      }

      return {
        lectureId: lec._id,
        title: lec.title,
        description: lec.description,
        order: lec.order,
        videoUrls: lec.videoUrls,
        isMandatory: lec.isMandatory,
        durationSeconds: lec.durationSeconds,
        isUnlocked,
        isCompleted,
        watchedSeconds,
        totalDurationSeconds,
        lastPositionSeconds,
      };
    });

    const totalMandatory = lectures.filter((l) => l.isMandatory).length;
    const completedMandatory = lecturesWithStatus.filter(
      (l) => l.isMandatory && l.isCompleted
    ).length;
    const allMandatoryDone = totalMandatory === 0 || completedMandatory >= totalMandatory;

    // Check exam attempts
    const examAttempts = await StudentExamAttemptModel.find({
      studentId,
      courseId,
    }).sort({ attemptNumber: 1 });

    const attemptsCount = examAttempts.length;
    const maxAttempts = course.examMaxAttempts || 3;
    const hasPassedExam = examAttempts.some((a) => a.isPassed);

    const isExamUnlocked =
      allMandatoryDone &&
      course.isExamAvailable &&
      (attemptsCount < maxAttempts || hasPassedExam);

    return {
      course,
      lectures: lecturesWithStatus,
      totalLectures: lectures.length,
      totalMandatory,
      completedMandatory,
      allMandatoryDone,
      exam: {
        isExamAvailable: course.isExamAvailable,
        isExamUnlocked,
        quizId: course.examQuizId?._id || course.examQuizId,
        quizTitle: course.examQuizId?.title || "Course Final Exam",
        attemptsCount,
        maxAttempts,
        hasPassedExam,
        passingPercentage: course.examPassingPercentage || 70,
        attempts: examAttempts,
      },
    };
  }

  static async updateLectureWatchProgress({
    studentId,
    courseId,
    lectureId,
    watchedSeconds = 0,
    totalDurationSeconds = 0,
    lastPositionSeconds = 0,
    markComplete = false,
  }) {
    let progress = await StudentLectureProgressModel.findOne({
      studentId,
      lectureId,
    });

    const shouldComplete =
      markComplete ||
      (totalDurationSeconds > 0 && watchedSeconds >= totalDurationSeconds * 0.95);

    if (!progress) {
      progress = await StudentLectureProgressModel.create({
        studentId,
        courseId,
        lectureId,
        watchedSeconds,
        totalDurationSeconds,
        lastPositionSeconds,
        isCompleted: shouldComplete,
        completedAt: shouldComplete ? new Date() : null,
      });
    } else {
      progress.watchedSeconds = Math.max(progress.watchedSeconds, watchedSeconds);
      if (totalDurationSeconds > 0) {
        progress.totalDurationSeconds = totalDurationSeconds;
      }
      progress.lastPositionSeconds = lastPositionSeconds;

      if (!progress.isCompleted && shouldComplete) {
        progress.isCompleted = true;
        progress.completedAt = new Date();
      }
      await progress.save();
    }

    return progress;
  }

  // =========================================================================
  // 8. EXAM ATTEMPTS & GRADING INTEGRATION
  // =========================================================================
  static async submitExamAttempt({
    studentId,
    courseId,
    quizId,
    quizSubmissionId,
    answers = [],
    score = 0,
    maxScore = 100,
    percentage = 0,
  }) {
    const course = await CourseModel.findById(courseId);
    if (!course) throw new Error("Course not found");

    const student = await UserModel.findById(studentId);
    const enrollment = await StudentEnrollmentModel.findOne({
      studentId,
      departmentId: course.departmentId,
    });

    const existingAttempts = await StudentExamAttemptModel.find({
      studentId,
      courseId,
    });
    const nextAttemptNumber = existingAttempts.length + 1;
    const maxAttempts = course.examMaxAttempts || 3;

    if (nextAttemptNumber > maxAttempts) {
      throw new Error(`You have already exhausted all ${maxAttempts} exam attempts for this course.`);
    }

    const calculatedPercentage =
      maxScore > 0 ? Math.round((score / maxScore) * 100) : percentage;
    const isPassed = calculatedPercentage >= (course.examPassingPercentage || 70);

    const attempt = await StudentExamAttemptModel.create({
      studentId,
      studentName: student?.name || "Student",
      rollNumber: enrollment?.rollNumber || "N/A",
      courseId,
      quizId,
      quizSubmissionId,
      attemptNumber: nextAttemptNumber,
      score,
      maxScore,
      percentage: calculatedPercentage,
      isPassed,
      answers,
      attemptedAt: new Date(),
    });

    return attempt;
  }

  // =========================================================================
  // 9. SEMESTER PROMOTION & CERTIFICATES
  // =========================================================================
  static async promoteStudent(studentId, departmentId) {
    const enrollment = await StudentEnrollmentModel.findOne({
      studentId,
      departmentId,
    });
    if (!enrollment) throw new Error("Enrollment not found");

    const dept = await DepartmentModel.findById(departmentId);
    const currentSem = enrollment.currentSemesterNumber || 1;

    if (currentSem >= (dept?.totalSemesters || 8)) {
      enrollment.status = "GRADUATED";
      await enrollment.save();

      // Issue Degree Certificate
      await this.awardCertificate({
        studentId,
        departmentId,
        type: "DEGREE",
        title: `Bachelor Degree in ${dept.name}`,
        grade: "PASSED WITH DISTINCTION",
      });

      return {
        status: "GRADUATED",
        message: "Student has successfully completed all semesters and graduated!",
        enrollment,
      };
    }

    const nextSemNumber = currentSem + 1;
    const nextSem = await SemesterModel.findOne({
      departmentId,
      semesterNumber: nextSemNumber,
    });

    if (!enrollment.completedSemesters) enrollment.completedSemesters = [];
    if (!enrollment.completedSemesters.includes(currentSem)) {
      enrollment.completedSemesters.push(currentSem);
    }

    enrollment.currentSemesterNumber = nextSemNumber;
    if (nextSem) {
      enrollment.currentSemesterId = nextSem._id;
    }
    enrollment.status = "PROMOTED";
    await enrollment.save();

    // Award Semester Certificate
    await this.awardCertificate({
      studentId,
      departmentId,
      semesterId: enrollment.currentSemesterId,
      type: "SEMESTER",
      title: `Certificate of Completion - Semester ${currentSem} (${dept.name})`,
      grade: "PASSED",
    });

    return {
      status: "PROMOTED",
      nextSemesterNumber: nextSemNumber,
      enrollment,
    };
  }

  static async awardCertificate({
    studentId,
    departmentId,
    semesterId,
    courseId,
    type = "SEMESTER",
    title,
    grade = "PASSED",
  }) {
    const student = await UserModel.findById(studentId);
    const dept = await DepartmentModel.findById(departmentId);
    const enrollment = await StudentEnrollmentModel.findOne({
      studentId,
      departmentId,
    });

    const uni = await this.getOrCreateUniversity();
    const year = new Date().getFullYear();
    const deptCode = dept?.code || "UNIV";
    const certCount = await CertificateModel.countDocuments();
    const certNumber = `CERT-${year}-${deptCode}-${type}-${String(certCount + 1).padStart(4, "0")}`;

    const cert = await CertificateModel.create({
      studentId,
      studentName: student?.name || "Student",
      rollNumber: enrollment?.rollNumber || "N/A",
      universityId: uni._id,
      departmentId,
      semesterId,
      courseId,
      type,
      certificateNumber: certNumber,
      title: title || `Certificate of Achievement - ${dept?.name}`,
      grade,
      status: "AWARDED",
      issuedDate: new Date(),
      issuedBy: "IIPC University Academic Council",
    });

    return cert;
  }

  static async listCertificates(filter = {}) {
    const query = { status: "AWARDED" };
    if (filter.studentId) query.studentId = filter.studentId;
    if (filter.departmentId) query.departmentId = filter.departmentId;

    return await CertificateModel.find(query)
      .populate("studentId", "name email")
      .populate("departmentId", "name code")
      .populate("semesterId", "semesterNumber title")
      .populate("courseId", "title code")
      .sort({ issuedDate: -1 });
  }

  // =========================================================================
  // 10. DIRECT 1-ON-1 MESSAGING (Student <-> Instructor)
  // =========================================================================
  static async getMessages(courseId, studentId) {
    return await UniversityMessageModel.find({ courseId, studentId }).sort({ createdAt: 1 });
  }

  static async sendMessage({
    courseId,
    studentId,
    instructorId,
    senderId,
    senderName,
    senderRole,
    message,
  }) {
    const course = await CourseModel.findById(courseId);
    const effInstructorId = instructorId || course?.instructorId || senderId;

    const msg = await UniversityMessageModel.create({
      courseId,
      studentId,
      instructorId: effInstructorId,
      senderId,
      senderName,
      senderRole,
      message,
    });
    return msg;
  }

  // =========================================================================
  // 11. PORTAL SUMMARY
  // =========================================================================
  static async getPortalSummary() {
    const university = await this.getOrCreateUniversity();
    const departments = await DepartmentModel.find({ isActive: true });
    const semesters = await SemesterModel.find({ isActive: true });
    const courses = await CourseModel.find({ isActive: true });
    const enrollments = await StudentEnrollmentModel.find()
      .populate("studentId", "name email role")
      .populate("departmentId", "name code")
      .populate("currentSemesterId", "semesterNumber title");
    const certificatesCount = await CertificateModel.countDocuments();

    return {
      university,
      totalDepartments: departments.length,
      totalSemesters: semesters.length,
      totalCourses: courses.length,
      totalStudents: enrollments.length,
      totalCertificates: certificatesCount,
      departments,
      courses,
      recentEnrollments: enrollments.slice(0, 10),
      allEnrollments: enrollments.map((e) => ({
        id: e._id,
        studentId: e.studentId?._id || e.studentId,
        name: e.studentId?.name || e.studentName,
        email: e.studentId?.email || e.studentEmail,
        rollNumber: e.rollNumber,
        department: e.departmentId?.name,
        departmentCode: e.departmentId?.code,
        semester: e.currentSemesterNumber,
        status: e.status,
        enrolledAt: e.enrolledAt,
      })),
    };
  }

  // =========================================================================
  // 12. DRAG & DROP REORDER LECTURES
  // =========================================================================
  static async reorderLectures(courseId, orderedLectureIds) {
    if (!Array.isArray(orderedLectureIds) || orderedLectureIds.length === 0) {
      throw new Error("orderedLectureIds must be a non-empty array of lecture IDs");
    }
    const operations = orderedLectureIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, courseId },
        update: { $set: { order: index + 1 } },
      },
    }));
    await LectureModel.bulkWrite(operations);
    return await this.listLectures(courseId);
  }

  // =========================================================================
  // 13. COURSE AUDIT FOR SUPER USER / INSTRUCTOR TRACKING
  // =========================================================================
  static async getCourseAudit(courseId) {
    const course = await CourseModel.findById(courseId)
      .populate("departmentId", "name code")
      .populate("semesterId", "semesterNumber title")
      .lean();
    if (!course) throw new Error("Course not found");

    const lectures = await LectureModel.find({ courseId, isActive: true }).sort({ order: 1 }).lean();
    const totalLecturesCount = lectures.length;
    const mandatoryCount = lectures.filter((l) => l.isMandatory).length;

    // Fetch enrollments for the department
    const deptId = course.departmentId?._id || course.departmentId;
    const enrollments = await StudentEnrollmentModel.find({ departmentId: deptId })
      .populate("studentId", "name email role")
      .lean();

    const studentsAudit = [];

    for (const enr of enrollments) {
      const studentId = enr.studentId?._id || enr.studentId;
      if (!studentId) continue;

      const progressList = await StudentLectureProgressModel.find({
        studentId,
        courseId,
      }).lean();

      const completedCount = progressList.filter((p) => p.isCompleted).length;
      const totalPercentage = totalLecturesCount > 0
        ? Math.min(100, Math.round((completedCount / totalLecturesCount) * 100))
        : 0;

      const examAttempts = await StudentExamAttemptModel.find({
        studentId,
        courseId,
      }).sort({ attemptNumber: -1 }).lean();

      const highestScore = examAttempts.reduce((max, a) => Math.max(max, a.percentage || 0), 0);
      const isPassed = examAttempts.some((a) => a.isPassed);

      studentsAudit.push({
        studentId,
        rollNumber: enr.rollNumber,
        name: enr.studentName || enr.studentId?.name || "Student",
        email: enr.studentEmail || enr.studentId?.email || "N/A",
        status: enr.status,
        completedLecturesCount: completedCount,
        totalLecturesCount,
        totalCoursePercentage: totalPercentage,
        examAttemptsCount: examAttempts.length,
        examHighestScore: highestScore,
        isExamPassed: isPassed,
        lastActivity: progressList.reduce((latest, p) => (!latest || p.updatedAt > latest ? p.updatedAt : latest), null) || enr.updatedAt,
      });
    }

    const avgPercentage = studentsAudit.length > 0
      ? Math.round(studentsAudit.reduce((acc, s) => acc + s.totalCoursePercentage, 0) / studentsAudit.length)
      : 0;

    return {
      courseId: course._id,
      courseTitle: course.title,
      courseCode: course.code,
      departmentName: course.departmentId?.name || "Academic Department",
      semesterTitle: course.semesterId?.title || "Semester 1",
      totalLecturesCount,
      mandatoryCount,
      totalEnrolledStudents: studentsAudit.length,
      averageCoursePercentage: avgPercentage,
      students: studentsAudit,
    };
  }

  // =========================================================================
  // 14. LECTURE NOTES (STUDENT TIME-STAMPED NOTES)
  // =========================================================================
  static async saveLectureNote(studentId, courseId, lectureId, text, timestampSeconds = 0) {
    if (!text || !text.trim()) {
      throw new Error("Note text cannot be empty");
    }
    let progress = await StudentLectureProgressModel.findOne({ studentId, lectureId });
    if (!progress) {
      progress = await StudentLectureProgressModel.create({
        studentId,
        courseId,
        lectureId,
        watchedSeconds: 0,
        notes: [],
      });
    }

    const note = {
      noteId: new mongoose.Types.ObjectId().toString(),
      text: text.trim(),
      timestampSeconds: Math.round(Number(timestampSeconds) || 0),
      createdAt: new Date(),
    };

    if (!Array.isArray(progress.notes)) {
      progress.notes = [];
    }
    progress.notes.push(note);
    await progress.save();
    return note;
  }

  static async getLectureNotes(studentId, lectureId) {
    const progress = await StudentLectureProgressModel.findOne({ studentId, lectureId }).lean();
    return progress?.notes || [];
  }

}
