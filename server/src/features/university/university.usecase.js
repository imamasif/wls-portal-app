import { syncUniversityCurriculum } from "./seedCurriculum.js";
import mongoose from "mongoose";
import {
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
import { UserModel } from "../users/user.model.js";
import { QuizModel } from "../quizzes/quiz.model.js";

async function resolveYouTubeDuration(url) {
  if (!url || typeof url !== "string") return 0;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (!match) return 0;
  const videoId = match[1];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const resp = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!resp.ok) return 0;
    const html = await resp.text();
    const m = html.match(/"lengthSeconds":"(\d+)"/);
    if (m && m[1]) {
      return parseInt(m[1], 10);
    }
    const m2 = html.match(/"approxDurationMs":"(\d+)"/);
    if (m2 && m2[1]) {
      return Math.round(parseInt(m2[1], 10) / 1000);
    }
  } catch (err) {
    console.warn(`Could not resolve YouTube duration for ${videoId}:`, err.message);
  }
  return 0;
}

export class UniversityUseCase {
  // =========================================================================
  // 1. UNIVERSITY PROFILE & SETUP
  // =========================================================================
  static async getOrCreateUniversity() {
    let uni = await UniversityModel.findOne({ isActive: true });
    if (!uni) {
      uni = await UniversityModel.create({
        name: "IIPC - International Islamic Propagation Center Canada University",
        code: "IIPC-U",
        viceChancellor: "Muhammad Shaikh",
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
    } else {
      let needsSave = false;
      if (
        uni.name === "International Islamic Propagation Center (IIPC) University" ||
        uni.name === "IIPC CANADA Quranic Educational University"
      ) {
        uni.name = "IIPC - International Islamic Propagation Center Canada University";
        needsSave = true;
      }
      if (!uni.viceChancellor) {
        uni.viceChancellor = "Muhammad Shaikh";
        needsSave = true;
      }
      if (needsSave) await uni.save();
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
    // Create default Batch 2026 for this new department
    const defaultBatch = await BatchModel.create({
      universityId: uniId,
      departmentId: dept._id,
      year: 2026,
      name: "Batch 2026",
      code: "B-2026",
      totalSemesters: totalSem,
      isActive: true,
      isGraduated: false,
    });

    // Link created semesters to default Batch 2026
    const semesterDocsWithBatch = semesterDocs.map((s) => ({
      ...s,
      batchId: defaultBatch._id,
      batchYear: 2026,
    }));
    await SemesterModel.insertMany(semesterDocsWithBatch);

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
    await BatchModel.deleteMany({ departmentId: id });
    await SemesterModel.deleteMany({ departmentId: id });
    await StudentEnrollmentModel.deleteMany({ departmentId: id });
    const dept = await DepartmentModel.findByIdAndDelete(id);
    if (!dept) throw new Error("Department not found");
    return dept;
  }

  // =========================================================================
  // 2b. BATCHES (YEAR COHORTS)
  // =========================================================================
  static async getOrCreateDefaultBatches(departmentId = null) {
    const uni = await this.getOrCreateUniversity();
    const activeDepts = await DepartmentModel.find({ isActive: true });
    const activeDeptIds = activeDepts.map((d) => d._id);

    // Clean up any orphan batches belonging to deleted departments
    await BatchModel.deleteMany({ departmentId: { $nin: activeDeptIds } });

    const deptQuery = { isActive: true };
    if (departmentId) deptQuery._id = departmentId;
    const depts = await DepartmentModel.find(deptQuery);

    for (const dept of depts) {
      let defaultBatch = await BatchModel.findOne({ departmentId: dept._id, year: 2026 });
      if (!defaultBatch) {
        defaultBatch = await BatchModel.create({
          universityId: uni._id,
          departmentId: dept._id,
          year: 2026,
          name: "Batch 2026",
          code: "B-2026",
          totalSemesters: dept.totalSemesters || 4,
          isActive: true,
          isGraduated: false,
        });
      }
      // Ensure existing semesters of this dept are linked to Batch 2026
      await SemesterModel.updateMany(
        { departmentId: dept._id, $or: [{ batchId: { $exists: false } }, { batchId: null }] },
        { $set: { batchId: defaultBatch._id, batchYear: 2026 } }
      );
    }
  }

  static async listBatches(filter = {}) {
    await this.getOrCreateDefaultBatches(filter.departmentId);
    const query = {};
    if (filter.departmentId) {
      const dId = filter.departmentId?._id || filter.departmentId;
      if (mongoose.Types.ObjectId.isValid(dId)) query.departmentId = dId;
    }
    if (filter.isActive !== undefined) {
      query.isActive = filter.isActive === "true" || filter.isActive === true;
    }
    return await BatchModel.find(query)
      .populate("departmentId", "name code totalSemesters")
      .sort({ year: -1, createdAt: -1 });
  }

  static async createBatch(payload) {
    let uniId = payload.universityId;
    if (!uniId) {
      const defaultUni = await this.getOrCreateUniversity();
      uniId = defaultUni._id;
    }

    const dept = await DepartmentModel.findById(payload.departmentId);
    if (!dept) throw new Error("Department not found for batch creation.");

    const batchYear = Number(payload.year) || new Date().getFullYear();
    const existing = await BatchModel.findOne({
      departmentId: dept._id,
      year: batchYear,
    });
    if (existing) {
      throw new Error(`Batch for year ${batchYear} already exists in ${dept.name}.`);
    }

    const batchName = payload.name?.trim() || `Batch ${batchYear}`;
    const batchCode = payload.code?.trim()?.toUpperCase() || `B-${batchYear}`;

    const batch = await BatchModel.create({
      universityId: uniId,
      departmentId: dept._id,
      year: batchYear,
      name: batchName,
      code: batchCode,
      startDate: payload.startDate,
      endDate: payload.endDate,
      totalSemesters: dept.totalSemesters || 4,
      isActive: true,
      isGraduated: false,
    });

    // Instantiate semesters for this batch (Semesters 1 to dept.totalSemesters)
    const numSemesters = dept.totalSemesters || 4;
    const createdSemesters = [];
    for (let s = 1; s <= numSemesters; s++) {
      const sem = await SemesterModel.create({
        universityId: uniId,
        departmentId: dept._id,
        batchId: batch._id,
        batchYear: batch.year,
        semesterNumber: s,
        title: `Semester ${s}`,
        academicYear: `${batchYear}-${batchYear + 1}`,
        isActive: true,
      });
      createdSemesters.push(sem);
    }

    // Clone curriculum from baseline batch so courses and videos remain intact!
    const baseBatch = await BatchModel.findOne({
      departmentId: dept._id,
      year: { $ne: batchYear },
    }).sort({ year: 1 });

    if (baseBatch) {
      const baseSemesters = await SemesterModel.find({ batchId: baseBatch._id }).sort({ semesterNumber: 1 });
      for (const targetSem of createdSemesters) {
        const sourceSem = baseSemesters.find((bs) => bs.semesterNumber === targetSem.semesterNumber);
        if (!sourceSem) continue;

        const sourceCourses = await CourseModel.find({ semesterId: sourceSem._id });
        for (const sc of sourceCourses) {
          const clonedCourse = await CourseModel.create({
            universityId: uniId,
            departmentId: dept._id,
            semesterId: targetSem._id,
            title: sc.title,
            code: `${sc.code}-${batchYear}`,
            description: sc.description,
            credits: sc.credits,
            instructorId: sc.instructorId,
            instructorName: sc.instructorName,
            isExamAvailable: sc.isExamAvailable,
            examQuizId: sc.examQuizId,
            examPassingPercentage: sc.examPassingPercentage,
            examMaxAttempts: sc.examMaxAttempts,
            isActive: sc.isActive,
          });

          // Clone lectures
          const sourceLectures = await LectureModel.find({ courseId: sc._id }).sort({ order: 1 });
          if (sourceLectures.length > 0) {
            const clonedLectures = sourceLectures.map((sl) => ({
              courseId: clonedCourse._id,
              topicName: sl.topicName,
              title: sl.title,
              description: sl.description,
              order: sl.order,
              videoUrls: sl.videoUrls,
              isMandatory: sl.isMandatory,
              durationSeconds: sl.durationSeconds,
              isActive: sl.isActive,
            }));
            await LectureModel.insertMany(clonedLectures);
          }
        }
      }
    }

    return batch;
  }

  static async updateBatch(id, payload) {
    const batch = await BatchModel.findById(id);
    if (!batch) throw new Error("Batch not found.");

    if (payload.name) batch.name = payload.name;
    if (payload.code) batch.code = payload.code;
    if (payload.startDate !== undefined) batch.startDate = payload.startDate;
    if (payload.endDate !== undefined) batch.endDate = payload.endDate;
    if (payload.isActive !== undefined) batch.isActive = payload.isActive;
    if (payload.isGraduated !== undefined) {
      batch.isGraduated = payload.isGraduated;
      if (payload.isGraduated) {
        await StudentEnrollmentModel.updateMany(
          { batchId: batch._id, status: { $ne: "GRADUATED" } },
          { $set: { status: "GRADUATED" } }
        );
      }
    }

    await batch.save();
    return batch;
  }

  static async deleteBatch(id) {
    const enrollmentsCount = await StudentEnrollmentModel.countDocuments({ batchId: id });
    if (enrollmentsCount > 0) {
      throw new Error(`Cannot delete batch. There are ${enrollmentsCount} active student enrollment(s) in this batch.`);
    }
    const batchSemesters = await SemesterModel.find({ batchId: id });
    const semIds = batchSemesters.map((s) => s._id);
    const courses = await CourseModel.find({ semesterId: { $in: semIds } });
    const courseIds = courses.map((c) => c._id);
    await LectureModel.deleteMany({ courseId: { $in: courseIds } });
    await CourseModel.deleteMany({ _id: { $in: courseIds } });
    await SemesterModel.deleteMany({ _id: { $in: semIds } });
    const batch = await BatchModel.findByIdAndDelete(id);
    if (!batch) throw new Error("Batch not found.");
    return { success: true, deletedBatchId: id };
  }

  // =========================================================================
  // 3. SEMESTERS
  // =========================================================================
  static async listSemesters(departmentId, batchId = null) {
    const query = { isActive: true };
    if (departmentId) query.departmentId = departmentId;
    if (batchId) query.batchId = batchId;
    const sems = await SemesterModel.find(query).sort({ semesterNumber: 1 });
    if (sems.length === 0 && departmentId && batchId) {
      // Fallback to department's base semesters if batch-specific semesters are not yet instantiated
      return await SemesterModel.find({ departmentId, isActive: true }).sort({ semesterNumber: 1 });
    }
    return sems;
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
    if (filter.batchId) {
      const bId = filter.batchId?._id || filter.batchId;
      if (mongoose.Types.ObjectId.isValid(bId)) {
        const batchSemesters = await SemesterModel.find({ batchId: bId });
        if (batchSemesters.length > 0) {
          query.semesterId = { $in: batchSemesters.map((s) => s._id) };
        }
      }
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
    if ((!payload.durationSeconds || payload.durationSeconds === 1800) && Array.isArray(payload.videoUrls) && payload.videoUrls.length > 0) {
      const detected = await resolveYouTubeDuration(payload.videoUrls[0]);
      if (detected > 0) {
        payload.durationSeconds = detected;
      }
    }
    const lecture = await LectureModel.create(payload);
    return lecture;
  }

  static async updateLecture(id, payload) {
    if (Array.isArray(payload.videoUrls) && payload.videoUrls.length > 0) {
      if (!payload.durationSeconds || payload.durationSeconds === 1800) {
        const detected = await resolveYouTubeDuration(payload.videoUrls[0]);
        if (detected > 0) {
          payload.durationSeconds = detected;
        }
      }
    }
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
  static async generateRollNumber(departmentCode, batchYear = new Date().getFullYear()) {
    const prefix = `${batchYear}-${departmentCode.toUpperCase()}-`;
    const count = await StudentEnrollmentModel.countDocuments({
      rollNumber: { $regex: `^${prefix}` },
    });
    const nextSeq = count + 1;
    return `${prefix}${String(nextSeq).padStart(3, "0")}`;
  }

  static async enrollStudent({ studentId, departmentId, batchId, semesterId, customRollNumber }) {
    const student = await UserModel.findById(studentId);
    if (!student) throw new Error("User not found to enroll.");

    const dept = await DepartmentModel.findById(departmentId);
    if (!dept) throw new Error("Department not found.");

    // Resolve Batch (default to active batch or Batch 2026)
    let targetBatch = null;
    if (batchId) {
      targetBatch = await BatchModel.findById(batchId);
    }
    if (!targetBatch) {
      targetBatch = await BatchModel.findOne({ departmentId: dept._id, isActive: true }).sort({ year: -1 });
    }
    if (!targetBatch) {
      await this.getOrCreateDefaultBatches(dept._id);
      targetBatch = await BatchModel.findOne({ departmentId: dept._id }).sort({ year: -1 });
    }

    const batchYear = targetBatch?.year || new Date().getFullYear();

    // Constraint: A student can only enroll in ONE batch per department until graduation
    const existingActiveInDept = await StudentEnrollmentModel.findOne({
      studentId: student._id,
      departmentId: dept._id,
      status: { $ne: "GRADUATED" },
    });
    if (existingActiveInDept) {
      const bName = existingActiveInDept.batchName || existingActiveInDept.batchYear || "an active batch";
      throw new Error(
        `Student ${student.name} is already enrolled in ${dept.name} under ${bName} with Roll Number: ${existingActiveInDept.rollNumber}. A student can only be enrolled in one batch per department until graduation.`
      );
    }

    let targetSemester = null;
    if (semesterId) {
      targetSemester = await SemesterModel.findById(semesterId);
    }
    if (!targetSemester && targetBatch) {
      targetSemester = await SemesterModel.findOne({
        departmentId: dept._id,
        batchId: targetBatch._id,
        semesterNumber: 1,
      });
    }
    if (!targetSemester) {
      targetSemester = await SemesterModel.findOne({
        departmentId: dept._id,
        semesterNumber: 1,
      });
    }

    const rollNumber =
      customRollNumber?.trim()?.toUpperCase() ||
      (await this.generateRollNumber(dept.code, batchYear));

    const uni = await this.getOrCreateUniversity();

    const enrollment = await StudentEnrollmentModel.create({
      studentId: student._id,
      studentName: student.name,
      studentEmail: student.email,
      universityId: uni._id,
      departmentId: dept._id,
      batchId: targetBatch?._id,
      batchYear,
      batchName: targetBatch?.name || `Batch ${batchYear}`,
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

  static async batchEnrollStudents({ studentIds = [], departmentIds = [], batchId = null }) {
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      throw new Error("Please select at least one student.");
    }
    if (!Array.isArray(departmentIds) || departmentIds.length === 0) {
      throw new Error("Please select at least one department.");
    }

    const uni = await this.getOrCreateUniversity();
    const createdEnrollments = [];
    const skipped = [];

    for (const sId of studentIds) {
      const student = await UserModel.findById(sId);
      if (!student) continue;

      for (const dId of departmentIds) {
        const dept = await DepartmentModel.findById(dId);
        if (!dept) continue;

        let targetBatch = null;
        if (batchId) {
          targetBatch = await BatchModel.findOne({ _id: batchId, departmentId: dept._id });
        }
        if (!targetBatch) {
          targetBatch = await BatchModel.findOne({ departmentId: dept._id, isActive: true }).sort({ year: -1 });
        }
        if (!targetBatch) {
          await this.getOrCreateDefaultBatches(dept._id);
          targetBatch = await BatchModel.findOne({ departmentId: dept._id }).sort({ year: -1 });
        }

        const batchYear = targetBatch?.year || new Date().getFullYear();

        const existingActiveInDept = await StudentEnrollmentModel.findOne({
          studentId: student._id,
          departmentId: dept._id,
          status: { $ne: "GRADUATED" },
        });

        if (existingActiveInDept) {
          skipped.push({
            studentName: student.name,
            departmentCode: dept.code,
            reason: `Already enrolled in ${existingActiveInDept.batchName || existingActiveInDept.batchYear} (Roll: ${existingActiveInDept.rollNumber})`,
          });
          continue;
        }

        let targetSemester = await SemesterModel.findOne({
          departmentId: dept._id,
          batchId: targetBatch?._id,
          semesterNumber: 1,
        });
        if (!targetSemester) {
          targetSemester = await SemesterModel.findOne({
            departmentId: dept._id,
            semesterNumber: 1,
          });
        }

        const rollNumber = await this.generateRollNumber(dept.code, batchYear);

        const enr = await StudentEnrollmentModel.create({
          studentId: student._id,
          studentName: student.name,
          studentEmail: student.email,
          universityId: uni._id,
          departmentId: dept._id,
          batchId: targetBatch?._id,
          batchYear,
          batchName: targetBatch?.name || `Batch ${batchYear}`,
          currentSemesterId: targetSemester?._id,
          currentSemesterNumber: targetSemester?.semesterNumber || 1,
          rollNumber,
          status: "ACTIVE",
        });

        createdEnrollments.push(enr);

        if (!student.roles) student.roles = [];
        if (!student.roles.includes("university_student")) {
          student.roles.push("university_student");
          await student.save();
        }
      }
    }

    return {
      success: true,
      createdCount: createdEnrollments.length,
      skippedCount: skipped.length,
      enrollments: createdEnrollments,
      skipped,
    };
  }

  static async quickCreateAndEnrollStudent({
    firstName,
    lastName = "",
    email,
    phone = "",
    departmentIds = [],
    batchId = null,
  }) {
    if (!firstName || !email) {
      throw new Error("First name and email are required.");
    }
    if (!Array.isArray(departmentIds) || departmentIds.length === 0) {
      throw new Error("Please select at least one department.");
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await UserModel.findOne({ email: cleanEmail });
    if (existingUser) {
      throw new Error(`A user with email '${cleanEmail}' already exists in the system.`);
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const newUser = await UserModel.create({
      name: fullName,
      email: cleanEmail,
      password: "User@12345",
      phone: phone.trim(),
      phones: phone.trim() ? [{ number: phone.trim(), type: "Mobile", isPrimary: true }] : [],
      role: "USER",
      roles: ["USER", "university_student"],
      isActive: true,
    });

    const uni = await this.getOrCreateUniversity();
    const createdEnrollments = [];

    for (const dId of departmentIds) {
      const dept = await DepartmentModel.findById(dId);
      if (!dept) continue;

      let targetBatch = null;
      if (batchId) {
        targetBatch = await BatchModel.findOne({ _id: batchId, departmentId: dept._id });
      }
      if (!targetBatch) {
        targetBatch = await BatchModel.findOne({ departmentId: dept._id, isActive: true }).sort({ year: -1 });
      }
      if (!targetBatch) {
        await this.getOrCreateDefaultBatches(dept._id);
        targetBatch = await BatchModel.findOne({ departmentId: dept._id }).sort({ year: -1 });
      }

      const batchYear = targetBatch?.year || new Date().getFullYear();

      let targetSemester = await SemesterModel.findOne({
        departmentId: dept._id,
        batchId: targetBatch?._id,
        semesterNumber: 1,
      });
      if (!targetSemester) {
        targetSemester = await SemesterModel.findOne({
          departmentId: dept._id,
          semesterNumber: 1,
        });
      }

      const rollNumber = await this.generateRollNumber(dept.code, batchYear);

      const enr = await StudentEnrollmentModel.create({
        studentId: newUser._id,
        studentName: newUser.name,
        studentEmail: newUser.email,
        universityId: uni._id,
        departmentId: dept._id,
        batchId: targetBatch?._id,
        batchYear,
        batchName: targetBatch?.name || `Batch ${batchYear}`,
        currentSemesterId: targetSemester?._id,
        currentSemesterNumber: targetSemester?.semesterNumber || 1,
        rollNumber,
        status: "ACTIVE",
      });

      createdEnrollments.push(enr);
    }

    return {
      success: true,
      user: newUser,
      enrollments: createdEnrollments,
    };
  }

  static async updateEnrollmentStatus(id, status) {
    const enr = await StudentEnrollmentModel.findById(id);
    if (!enr) throw new Error("Enrollment not found.");
    enr.status = status;
    await enr.save();
    return enr;
  }

  static async deleteEnrollment(id) {
    const enr = await StudentEnrollmentModel.findByIdAndDelete(id);
    if (!enr) throw new Error("Enrollment not found.");
    return { success: true, deletedId: id };
  }

  static async listEnrollments(filter = {}) {
    const query = {};
    if (filter.departmentId) {
      const dId = filter.departmentId?._id || filter.departmentId;
      if (mongoose.Types.ObjectId.isValid(dId)) query.departmentId = dId;
    }
    if (filter.batchId) {
      const bId = filter.batchId?._id || filter.batchId;
      if (mongoose.Types.ObjectId.isValid(bId)) query.batchId = bId;
    }
    if (filter.studentId) {
      const sId = filter.studentId?._id || filter.studentId;
      if (mongoose.Types.ObjectId.isValid(sId)) query.studentId = sId;
    }
    if (filter.status) query.status = filter.status;

    return await StudentEnrollmentModel.find(query)
      .populate("studentId", "name email role")
      .populate("departmentId", "name code")
      .populate("batchId", "name year code")
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
        durationSeconds:
          totalDurationSeconds > 0 && totalDurationSeconds !== 1800
            ? totalDurationSeconds
            : (lec.durationSeconds || 0),
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
    let totalProgressSum = 0;
    lecturesWithStatus.forEach((l) => {
      if (l.isCompleted) {
        totalProgressSum += 1.0;
      } else {
        const dur = l.totalDurationSeconds || l.durationSeconds || 1800;
        if (dur > 0 && l.watchedSeconds > 0) {
          totalProgressSum += Math.min(0.99, l.watchedSeconds / dur);
        }
      }
    });

    const totalPercentage = lectures.length > 0
      ? Math.min(100, Math.round((totalProgressSum / lectures.length) * 100))
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

    // Self-healing: if lecture has default 1800 or 0, update it with real duration from player
    if (totalDurationSeconds > 0 && lecture) {
      if (!lecture.durationSeconds || lecture.durationSeconds === 1800) {
        lecture.durationSeconds = Math.round(totalDurationSeconds);
        lecture.save().catch(() => {});
      }
    }

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
  static async syncAllLectureDurationsBackground() {
    try {
      const lecturesToSync = await LectureModel.find({
        $or: [{ durationSeconds: 0 }, { durationSeconds: 1800 }, { durationSeconds: null }],
        "videoUrls.0": { $exists: true },
      });
      if (!lecturesToSync || lecturesToSync.length === 0) return;
      console.log(`[University] Auto-syncing real durations for ${lecturesToSync.length} lectures in background...`);
      for (const lec of lecturesToSync) {
        if (Array.isArray(lec.videoUrls) && lec.videoUrls[0]) {
          const detected = await resolveYouTubeDuration(lec.videoUrls[0]);
          if (detected > 0) {
            lec.durationSeconds = detected;
            await lec.save();
          }
        }
      }
      console.log(`[University] Finished auto-syncing real durations.`);
    } catch (err) {
      console.warn(`[University] Auto-sync lecture durations error:`, err.message);
    }
  }

  static async getPortalSummary() {
    const university = await this.getOrCreateUniversity();
    const departments = await DepartmentModel.find({ isActive: true });
    const activeDeptIds = departments.map((d) => d._id);

    // Clean up any orphan batches belonging to deleted departments
    await BatchModel.deleteMany({ departmentId: { $nin: activeDeptIds } });

    const semesters = await SemesterModel.find({ isActive: true, departmentId: { $in: activeDeptIds } });
    const courses = await CourseModel.find({ isActive: true, departmentId: { $in: activeDeptIds } });
    const batches = await BatchModel.find({ isActive: true, departmentId: { $in: activeDeptIds } });
    const enrollments = await StudentEnrollmentModel.find({ departmentId: { $in: activeDeptIds } })
      .populate("studentId", "name email role")
      .populate("departmentId", "name code")
      .populate("batchId", "name year code")
      .populate("currentSemesterId", "semesterNumber title");
    const certificatesCount = await CertificateModel.countDocuments();

    return {
      university,
      totalDepartments: departments.length,
      totalBatches: batches.length,
      totalSemesters: semesters.length,
      totalCourses: courses.length,
      totalStudents: enrollments.length,
      totalCertificates: certificatesCount,
      departments,
      batches,
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
        batchId: e.batchId?._id || e.batchId,
        batchYear: e.batchYear || 2026,
        batchName: e.batchName || (e.batchId?.name ? e.batchId.name : `Batch ${e.batchYear || 2026}`),
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
      let totalProgressSum = 0;
      lectures.forEach((lec) => {
        const p = progressList.find((x) => x.lectureId?.toString() === lec._id?.toString());
        if (p?.isCompleted) {
          totalProgressSum += 1.0;
        } else if (p && p.watchedSeconds > 0) {
          const dur = p.totalDurationSeconds || lec.durationSeconds || 1800;
          totalProgressSum += Math.min(0.99, p.watchedSeconds / dur);
        }
      });
      const totalPercentage = totalLecturesCount > 0
        ? Math.min(100, Math.round((totalProgressSum / totalLecturesCount) * 100))
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
        batchId: enr.batchId,
        batchYear: enr.batchYear,
        batchName: enr.batchName || `Batch ${enr.batchYear || 2026}`,
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
            let deptProgressSum = 0;
            const courseLecs = await LectureModel.find({ courseId: course._id, isActive: true }).lean();
            courseLecs.forEach((lec) => {
              const p = progressDocs.find((x) => x.lectureId?.toString() === lec._id?.toString());
              if (p?.isCompleted) {
                deptProgressSum += 1.0;
              } else if (p && p.watchedSeconds > 0) {
                const dur = p.totalDurationSeconds || lec.durationSeconds || 1800;
                deptProgressSum += Math.min(0.99, p.watchedSeconds / dur);
              }
            });
            const percentage = totalLecs > 0 ? Math.min(100, Math.round((deptProgressSum / totalLecs) * 100)) : 0;

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
