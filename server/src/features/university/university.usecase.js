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
    // syncUniversityCurriculum removed from auto-trigger
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

    const totalSem = Math.max(1, Math.min(12, Number(payload.totalSemesters) || 4));

    const dept = await DepartmentModel.create({
      ...payload,
      universityId: uniId,
      code: cleanCode,
      totalSemesters: totalSem,
    });

    // Auto-create Semesters 1 to totalSemesters (default 4)
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
    const dept = await DepartmentModel.findById(id);
    if (!dept) throw new Error("Department not found");

    if (payload.code) {
      payload.code = payload.code.trim().toUpperCase();
    }

    // Handle totalSemesters synchronization
    if (payload.totalSemesters !== undefined && payload.totalSemesters !== null) {
      const newTotal = Math.max(1, Math.min(12, Number(payload.totalSemesters)));
      const existingSemesters = await SemesterModel.find({ departmentId: dept._id }).sort({ semesterNumber: 1 });
      const currentCount = existingSemesters.length;

      if (newTotal < currentCount) {
        // Find semesters that would be removed (semesterNumber > newTotal)
        const semestersToRemove = existingSemesters.filter((s) => s.semesterNumber > newTotal);
        const semIdsToRemove = semestersToRemove.map((s) => s._id);

        // Check if ANY course is assigned to these semesters
        const coursesInRemovedSemesters = await CourseModel.find({
          departmentId: dept._id,
          semesterId: { $in: semIdsToRemove },
        });

        if (coursesInRemovedSemesters.length > 0) {
          const semNumbersWithCourses = [...new Set(
            coursesInRemovedSemesters.map((c) => {
              const sem = semestersToRemove.find((s) => s._id.toString() === c.semesterId.toString());
              return sem ? `Semester ${sem.semesterNumber}` : "Unknown";
            })
          )];
          const courseListStr = coursesInRemovedSemesters.map((c) => `[${c.code}] ${c.title}`).join(", ");
          throw new Error(
            `Cannot reduce semesters from ${currentCount} to ${newTotal}. Active course(s) and exam(s) exist in ${semNumbersWithCourses.join(", ")}: ${courseListStr}. Please clear or reassign those courses first before reducing semesters.`
          );
        }

        // If no courses exist, remove the excess semesters
        await SemesterModel.deleteMany({
          departmentId: dept._id,
          semesterNumber: { $gt: newTotal },
        });
      } else if (newTotal > currentCount) {
        // Generate missing semesters up to newTotal
        const existingNumbers = new Set(existingSemesters.map((s) => s.semesterNumber));
        const newSemDocs = [];
        for (let i = 1; i <= newTotal; i++) {
          if (!existingNumbers.has(i)) {
            newSemDocs.push({
              universityId: dept.universityId,
              departmentId: dept._id,
              semesterNumber: i,
              title: `Semester ${i}`,
              academicYear: "2026-2027",
              isActive: true,
            });
          }
        }
        if (newSemDocs.length > 0) {
          await SemesterModel.insertMany(newSemDocs);
        }
      }

      dept.totalSemesters = newTotal;
    }

    if (payload.name) dept.name = payload.name;
    if (payload.code) dept.code = payload.code;
    if (payload.description !== undefined) dept.description = payload.description;
    if (payload.headOfDepartment !== undefined) dept.headOfDepartment = payload.headOfDepartment;
    if (payload.isActive !== undefined) dept.isActive = payload.isActive;

    await dept.save();
    return dept;
  }

  static async checkDepartmentDeletionEligibility(id) {
    const dept = await DepartmentModel.findById(id);
    if (!dept) throw new Error("Department not found");

    const courses = await CourseModel.find({ departmentId: id }).populate("semesterId", "semesterNumber title");
    const semesters = await SemesterModel.find({ departmentId: id }).sort({ semesterNumber: 1 });
    const enrollmentsCount = await StudentEnrollmentModel.countDocuments({ departmentId: id });

    return {
      department: dept,
      canDelete: courses.length === 0,
      totalCourses: courses.length,
      courses: courses.map((c) => ({
        id: c._id,
        code: c.code,
        title: c.title,
        semesterNumber: c.semesterId?.semesterNumber || 1,
        hasExam: !!c.examQuizId,
      })),
      totalSemesters: semesters.length,
      totalEnrollments: enrollmentsCount,
    };
  }

  static async deleteDepartment(id) {
    const activeCourses = await CourseModel.find({ departmentId: id });
    if (activeCourses.length > 0) {
      const courseSummary = activeCourses.map((c) => `[${c.code}] ${c.title}`).join(", ");
      throw new Error(
        `Cannot delete department. There are ${activeCourses.length} active course(s) and affiliated exams (${courseSummary}) assigned to this department. You must clear or reassign those courses first before deleting.`
      );
    }
    await SemesterModel.deleteMany({ departmentId: id });
    await StudentEnrollmentModel.deleteMany({ departmentId: id });
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
    const activeCourses = await CourseModel.find({ semesterId: id });
    if (activeCourses.length > 0) {
      const courseSummary = activeCourses.map((c) => `[${c.code}] ${c.title}`).join(", ");
      throw new Error(
        `Cannot delete semester. There are ${activeCourses.length} active course(s) and affiliated exams (${courseSummary}) assigned to this semester. First reassign or delete these courses.`
      );
    }
    const sem = await SemesterModel.findByIdAndDelete(id);
    if (!sem) throw new Error("Semester not found");
    return sem;
  }

  // =========================================================================
  // 4. COURSES
  // =========================================================================
  static async listCourses(filter = {}) {
    const query = {};
    if (filter.includeInactive === "true" || filter.includeInactive === true) {
      if (filter.isActive !== undefined) {
        query.isActive = filter.isActive === "true" || filter.isActive === true;
      }
    } else {
      query.isActive = true;
    }
    if (filter.departmentId) {
      const dId = filter.departmentId?._id || filter.departmentId;
      if (mongoose.Types.ObjectId.isValid(dId)) query.departmentId = dId;
    }
    if (filter.semesterId) {
      const sId = filter.semesterId?._id || filter.semesterId;
      if (mongoose.Types.ObjectId.isValid(sId)) query.semesterId = sId;
    }
    if (filter.instructorId) {
      const iId = filter.instructorId?._id || filter.instructorId;
      if (mongoose.Types.ObjectId.isValid(iId)) query.instructorId = iId;
    }

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

  static async toggleCourseActive(id, isActive) {
    const course = await CourseModel.findByIdAndUpdate(
      id,
      { isActive: Boolean(isActive) },
      { new: true }
    );
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
    if (filter.departmentId) {
      const dId = filter.departmentId?._id || filter.departmentId;
      if (mongoose.Types.ObjectId.isValid(dId)) query.departmentId = dId;
    }
    if (filter.studentId) {
      const sId = filter.studentId?._id || filter.studentId;
      if (mongoose.Types.ObjectId.isValid(sId)) query.studentId = sId;
    }
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
      const watchedSeconds = p ? p.watchedSeconds : 0;
      const totalDurationSeconds = p ? p.totalDurationSeconds : lec.durationSeconds || 0;
      const lastPositionSeconds = p ? p.lastPositionSeconds : 0;

      // Anti-Cheat Verification:
      // If lecture is mandatory, student MUST have legitimately watched >= 90% of the video.
      // Invalidate false completion if user bypassed video time without watching.
      let isCompleted = false;
      if (p) {
        if (!lec.isMandatory) {
          isCompleted = Boolean(p.isCompleted);
        } else {
          const dur = totalDurationSeconds || lec.durationSeconds || 0;
          if (dur > 0 && watchedSeconds >= dur * 0.90) {
            isCompleted = true;
          } else {
            isCompleted = false;
            if (p.isCompleted) {
              p.isCompleted = false;
              p.completedAt = null;
              p.save().catch(() => {});
            }
          }
        }
      }

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

    const completedCount = lecturesWithStatus.filter((l) => l.isCompleted).length;
    const totalPercentage = lectures.length > 0
      ? Math.round((completedCount / lectures.length) * 100)
      : 0;

    return {
      course,
      lectures: lecturesWithStatus,
      totalLectures: lectures.length,
      totalMandatory,
      completedMandatory,
      completedCount,
      remainingCount: Math.max(0, lectures.length - completedCount),
      totalCoursePercentage: totalPercentage,
      allMandatoryDone,
      exam: {
        isExamAvailable: course.isExamAvailable,
        isExamUnlocked,
        quizId: course.examQuizId?._id || course.examQuizId,
        quizTitle: course.examQuizId?.title || "Allah and Aaliha Quiz",
        quizDescription: course.examQuizId?.description || "Alfaaz ke rang aur maienay ki shanakht karen.",
        questionsCount: course.examQuizId?.questions?.length || 69,
        questions: course.examQuizId?.questions || [],
        quizTime: "2 Hours",
        attemptsCount,
        maxAttempts: course.examMaxAttempts || 5,
        hasPassedExam,
        passingPercentage: course.examPassingPercentage || 75,
        highestScore: examAttempts.reduce((max, a) => Math.max(max, a.percentage || 0), 0),
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

    const lecture = await LectureModel.findById(lectureId);
    const isMandatory = lecture ? lecture.isMandatory !== false : true;

    const effectiveDuration = totalDurationSeconds > 0 
      ? totalDurationSeconds 
      : (lecture?.durationSeconds || progress?.totalDurationSeconds || 0);

    const currentWatched = Math.max(progress?.watchedSeconds || 0, watchedSeconds);

    // Anti-Cheat Enforcement:
    // If lecture is mandatory, student MUST have watched at least 90% of the video duration.
    // Client cannot bypass this by sending markComplete=true!
    let shouldComplete = false;
    if (isMandatory) {
      shouldComplete = effectiveDuration > 0 && currentWatched >= effectiveDuration * 0.90;
    } else {
      shouldComplete = markComplete || (effectiveDuration > 0 && currentWatched >= effectiveDuration * 0.90);
    }

    if (!progress) {
      progress = await StudentLectureProgressModel.create({
        studentId,
        courseId,
        lectureId,
        watchedSeconds: currentWatched,
        totalDurationSeconds: effectiveDuration,
        lastPositionSeconds,
        isCompleted: shouldComplete,
        completedAt: shouldComplete ? new Date() : null,
      });
    } else {
      progress.watchedSeconds = currentWatched;
      if (effectiveDuration > 0) {
        progress.totalDurationSeconds = effectiveDuration;
      }
      progress.lastPositionSeconds = lastPositionSeconds;

      if (!progress.isCompleted && shouldComplete) {
        progress.isCompleted = true;
        progress.completedAt = new Date();
      } else if (progress.isCompleted && !shouldComplete && isMandatory) {
        // Revoke illegitimate completion on mandatory lecture if watched seconds is insufficient
        progress.isCompleted = false;
        progress.completedAt = null;
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

  // =========================================================================
  // 15. UNIVERSITY-WIDE & DEPARTMENT-WIDE ANALYTICS & AUDIT REPORT
  // =========================================================================
  static async getUniversityAnalyticsReport(filter = {}) {
    const deptQuery = { isActive: true };
    if (filter.departmentId) deptQuery._id = filter.departmentId;

    const departments = await DepartmentModel.find(deptQuery).sort({ name: 1 }).lean();
    const reportDepts = [];

    for (const dept of departments) {
      const semesters = await SemesterModel.find({ departmentId: dept._id }).sort({ semesterNumber: 1 }).lean();
      const deptCourses = await CourseModel.find({ departmentId: dept._id }).sort({ code: 1 }).lean();
      const deptEnrollments = await StudentEnrollmentModel.find({ departmentId: dept._id })
        .populate("studentId", "name email")
        .lean();

      const semestersData = [];

      for (const sem of semesters) {
        if (filter.semesterId && sem._id.toString() !== filter.semesterId.toString()) {
          continue;
        }

        const semCourses = deptCourses.filter(
          (c) => c.semesterId && c.semesterId.toString() === sem._id.toString()
        );

        // Enrolled students in this semester (or department)
        const semStudents = deptEnrollments.filter(
          (e) => !e.currentSemesterId || e.currentSemesterId.toString() === sem._id.toString()
        );

        const coursesData = [];
        for (const course of semCourses) {
          const lectures = await LectureModel.find({ courseId: course._id, isActive: true }).sort({ order: 1 }).lean();
          const totalLecs = lectures.length;

          const studentProgressList = [];
          for (const enrollment of semStudents) {
            const studentId = enrollment.studentId?._id || enrollment.studentId;
            if (!studentId) continue;

            const progressDocs = await StudentLectureProgressModel.find({
              studentId,
              courseId: course._id,
            }).lean();

            const completedCount = progressDocs.filter((p) => p.isCompleted).length;
            const examAttempts = await StudentExamAttemptModel.find({
              studentId,
              courseId: course._id,
            }).sort({ createdAt: -1 }).lean();

            const highestScore = examAttempts.reduce((max, a) => Math.max(max, a.percentage || 0), 0);
            const isExamPassed = examAttempts.some((a) => a.isPassed);
            const totalWatchSeconds = progressDocs.reduce((acc, p) => acc + (p.watchTimeSeconds || 0), 0);
            const percentage = totalLecs > 0 ? Math.round((completedCount / totalLecs) * 100) : 0;

            studentProgressList.push({
              studentId,
              name: enrollment.studentName || enrollment.studentId?.name || "Student",
              email: enrollment.studentEmail || enrollment.studentId?.email || "",
              rollNumber: enrollment.rollNumber,
              completedLecturesCount: completedCount,
              remainingLecturesCount: Math.max(0, totalLecs - completedCount),
              totalLecturesCount: totalLecs,
              totalCoursePercentage: percentage,
              examAttemptsCount: examAttempts.length,
              examHighestScore: highestScore,
              isExamPassed,
              watchTimeMinutes: Math.round(totalWatchSeconds / 60),
            });
          }

          const avgCourseProgress = studentProgressList.length > 0
            ? Math.round(
                studentProgressList.reduce((acc, s) => acc + s.totalCoursePercentage, 0) /
                  studentProgressList.length
              )
            : 0;

          coursesData.push({
            id: course._id,
            code: course.code,
            title: course.title,
            instructorName: course.instructorName || dept.headOfDepartment || "Instructor",
            credits: course.credits || 3,
            startDate: course.startDate,
            endDate: course.endDate,
            isActive: course.isActive,
            isExamAvailable: course.isExamAvailable,
            examPassingPercentage: course.examPassingPercentage || 75,
            examMaxAttempts: course.examMaxAttempts || 5,
            hasExam: !!course.examQuizId,
            totalLectures: totalLecs,
            enrolledStudentsCount: semStudents.length,
            averageCoursePercentage: avgCourseProgress,
            students: studentProgressList,
          });
        }

        const allSemStudentProgresses = coursesData.flatMap((c) => c.students);
        const avgSemProgress = allSemStudentProgresses.length > 0
          ? Math.round(
              allSemStudentProgresses.reduce((acc, s) => acc + s.totalCoursePercentage, 0) /
                allSemStudentProgresses.length
            )
          : 0;

        semestersData.push({
          id: sem._id,
          semesterNumber: sem.semesterNumber,
          title: sem.title,
          academicYear: sem.academicYear || "2026-2027",
          startDate: sem.startDate,
          endDate: sem.endDate,
          isActive: sem.isActive,
          coursesCount: semCourses.length,
          enrolledStudentsCount: semStudents.length,
          averageSemesterPercentage: avgSemProgress,
          courses: coursesData,
        });
      }

      reportDepts.push({
        id: dept._id,
        name: dept.name,
        code: dept.code,
        headOfDepartment: dept.headOfDepartment,
        description: dept.description,
        totalSemesters: dept.totalSemesters || semesters.length,
        actualSemestersCount: semesters.length,
        totalCoursesCount: deptCourses.length,
        totalEnrolledStudents: deptEnrollments.length,
        semesters: semestersData,
      });
    }

    return {
      departments: reportDepts,
      generatedAt: new Date().toISOString(),
    };
  }
}
