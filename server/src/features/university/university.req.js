export class CreateUniversityReqDTO {
  constructor(data = {}) {
    this.name = data.name?.trim();
    this.code = data.code?.trim()?.toUpperCase();
    this.description = data.description?.trim() || "";
    this.logoUrl = data.logoUrl?.trim() || "";
    this.foundedYear = Number(data.foundedYear) || 2026;
    this.address = data.address?.trim() || "Canada";
    this.contactEmail = data.contactEmail?.trim()?.toLowerCase() || "info@iipc.ca";
    this.contactPhone = data.contactPhone?.trim() || "";
    this.isActive = data.isActive !== undefined ? Boolean(data.isActive) : true;
    this.createdBy = data.createdBy || "super_user";
  }
}

export class CreateDepartmentReqDTO {
  constructor(data = {}) {
    this.universityId = data.universityId;
    this.name = data.name?.trim();
    this.code = data.code?.trim()?.toUpperCase();
    this.description = data.description?.trim() || "";
    this.headOfDepartment = data.headOfDepartment?.trim() || "";
    this.totalSemesters = Number(data.totalSemesters) || 8;
    this.isActive = data.isActive !== undefined ? Boolean(data.isActive) : true;
  }
}

export class CreateSemesterReqDTO {
  constructor(data = {}) {
    this.universityId = data.universityId;
    this.departmentId = data.departmentId;
    this.semesterNumber = Number(data.semesterNumber) || 1;
    this.title = data.title?.trim();
    this.academicYear = data.academicYear?.trim() || "2026-2027";
    this.startDate = data.startDate ? new Date(data.startDate) : undefined;
    this.endDate = data.endDate ? new Date(data.endDate) : undefined;
    this.isActive = data.isActive !== undefined ? Boolean(data.isActive) : true;
  }
}

export class CreateCourseReqDTO {
  constructor(data = {}) {
    this.universityId = data.universityId;
    this.departmentId = data.departmentId;
    this.semesterId = data.semesterId;
    this.title = data.title?.trim();
    this.code = data.code?.trim()?.toUpperCase();
    this.description = data.description?.trim() || "";
    this.credits = Number(data.credits) || 3;
    this.instructorId = data.instructorId || null;
    this.instructorName = data.instructorName?.trim() || "";
    this.isExamAvailable = Boolean(data.isExamAvailable);
    this.examQuizId = data.examQuizId || null;
    this.examPassingPercentage = Number(data.examPassingPercentage) || 70;
    this.examMaxAttempts = Number(data.examMaxAttempts) || 3;
    this.isActive = data.isActive !== undefined ? Boolean(data.isActive) : true;
  }
}

export class CreateLectureReqDTO {
  constructor(data = {}) {
    this.courseId = data.courseId;
    this.title = data.title?.trim();
    this.description = data.description?.trim() || "";
    this.order = Number(data.order) || 1;
    this.videoUrls = Array.isArray(data.videoUrls)
      ? data.videoUrls
          .map((url) => (typeof url === "string" ? url.trim() : ""))
          .filter(Boolean)
      : data.videoUrl
      ? [data.videoUrl.trim()]
      : [];
    this.isMandatory =
      data.isMandatory !== undefined ? Boolean(data.isMandatory) : true;
    this.durationSeconds = Number(data.durationSeconds) || 0;
    this.isActive = data.isActive !== undefined ? Boolean(data.isActive) : true;
  }
}

export class EnrollStudentReqDTO {
  constructor(data = {}) {
    this.studentId = data.studentId;
    this.departmentId = data.departmentId;
    this.semesterId = data.semesterId;
    this.customRollNumber = data.customRollNumber?.trim()?.toUpperCase();
  }
}

export class UpdateProgressReqDTO {
  constructor(data = {}) {
    this.studentId = data.studentId;
    this.courseId = data.courseId;
    this.lectureId = data.lectureId;
    this.watchedSeconds = Math.max(0, Number(data.watchedSeconds) || 0);
    this.totalDurationSeconds = Math.max(0, Number(data.totalDurationSeconds) || 0);
    this.lastPositionSeconds = Math.max(0, Number(data.lastPositionSeconds) || 0);
    this.markComplete = Boolean(data.markComplete);
  }
}

export class SubmitExamAttemptReqDTO {
  constructor(data = {}) {
    this.studentId = data.studentId;
    this.courseId = data.courseId;
    this.quizId = data.quizId;
    this.answers = Array.isArray(data.answers) ? data.answers : [];
    this.score = Number(data.score) || 0;
    this.maxScore = Number(data.maxScore) || 100;
    this.percentage = Number(data.percentage) || 0;
  }
}

export class AwardCertificateReqDTO {
  constructor(data = {}) {
    this.studentId = data.studentId;
    this.departmentId = data.departmentId;
    this.semesterId = data.semesterId || null;
    this.courseId = data.courseId || null;
    this.type = data.type || "SEMESTER";
    this.title = data.title?.trim();
    this.grade = data.grade?.trim() || "PASSED";
  }
}

export class SendMessageReqDTO {
  constructor(data = {}) {
    this.courseId = data.courseId;
    this.studentId = data.studentId;
    this.instructorId = data.instructorId || null;
    this.senderId = data.senderId;
    this.senderName = data.senderName?.trim() || "User";
    this.senderRole = data.senderRole?.trim() || "STUDENT";
    this.message = data.message?.trim();
  }
}
