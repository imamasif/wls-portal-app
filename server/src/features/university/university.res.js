export class UniversityResDTO {
  constructor(entity) {
    const doc = entity.toObject ? entity.toObject() : entity;
    this.id = doc._id?.toString() || doc.id;
    this.name = doc.name;
    this.code = doc.code;
    this.viceChancellor = doc.viceChancellor || "Muhammad Shaikh";
    this.description = doc.description || "";
    this.logoUrl = doc.logoUrl || "";
    this.foundedYear = doc.foundedYear || 2026;
    this.address = doc.address || "";
    this.contactEmail = doc.contactEmail || "";
    this.contactPhone = doc.contactPhone || "";
    this.isActive = doc.isActive !== undefined ? doc.isActive : true;
    this.createdAt = doc.createdAt;
    this.updatedAt = doc.updatedAt;
  }
}

export class DepartmentResDTO {
  constructor(entity) {
    const doc = entity.toObject ? entity.toObject() : entity;
    this.id = doc._id?.toString() || doc.id;
    this.universityId = doc.universityId?._id?.toString() || doc.universityId?.toString();
    this.name = doc.name;
    this.code = doc.code;
    this.description = doc.description || "";
    this.headOfDepartment = doc.headOfDepartment || "";
    this.totalSemesters = doc.totalSemesters || 8;
    this.isActive = doc.isActive !== undefined ? doc.isActive : true;
    this.createdAt = doc.createdAt;
  }
}

export class BatchResDTO {
  constructor(entity) {
    const doc = entity.toObject ? entity.toObject() : entity;
    this.id = doc._id?.toString() || doc.id;
    this.universityId = doc.universityId?._id?.toString() || doc.universityId?.toString();
    this.departmentId = doc.departmentId?._id?.toString() || doc.departmentId?.toString();
    this.departmentName = doc.departmentId?.name || "";
    this.departmentCode = doc.departmentId?.code || "";
    this.year = doc.year || 2026;
    this.name = doc.name || `Batch ${this.year}`;
    this.code = doc.code || `B-${this.year}`;
    this.startDate = doc.startDate;
    this.endDate = doc.endDate;
    this.totalSemesters = doc.totalSemesters || 4;
    this.isActive = doc.isActive !== undefined ? doc.isActive : true;
    this.isGraduated = Boolean(doc.isGraduated);
    this.createdAt = doc.createdAt;
  }
}

export class SemesterResDTO {
  constructor(entity) {
    const doc = entity.toObject ? entity.toObject() : entity;
    this.id = doc._id?.toString() || doc.id;
    this.universityId = doc.universityId?._id?.toString() || doc.universityId?.toString();
    this.departmentId = doc.departmentId?._id?.toString() || doc.departmentId?.toString();
    this.departmentName = doc.departmentId?.name || "";
    this.departmentCode = doc.departmentId?.code || "";
    this.batchId = doc.batchId?._id?.toString() || doc.batchId?.toString() || "";
    this.batchYear = doc.batchYear || 2026;
    this.semesterNumber = doc.semesterNumber;
    this.title = doc.title;
    this.academicYear = doc.academicYear || "2026-2027";
    this.startDate = doc.startDate;
    this.endDate = doc.endDate;
    this.isActive = doc.isActive !== undefined ? doc.isActive : true;
    this.createdAt = doc.createdAt;
  }
}

export class CourseResDTO {
  constructor(entity) {
    const doc = entity.toObject ? entity.toObject() : entity;
    this.id = doc._id?.toString() || doc.id;
    this.universityId = doc.universityId?._id?.toString() || doc.universityId?.toString();
    this.departmentId = doc.departmentId?._id?.toString() || doc.departmentId?.toString();
    this.departmentName = doc.departmentId?.name || "";
    this.departmentCode = doc.departmentId?.code || "";
    this.semesterId = doc.semesterId?._id?.toString() || doc.semesterId?.toString();
    this.semesterNumber = doc.semesterId?.semesterNumber || 1;
    this.title = doc.title;
    this.code = doc.code;
    this.description = doc.description || "";
    this.credits = doc.credits || 3;
    this.instructorId = doc.instructorId?._id?.toString() || doc.instructorId?.toString();
    this.instructorName = doc.instructorName || "";
    this.isExamAvailable = Boolean(doc.isExamAvailable);
    this.examQuizId = doc.examQuizId?._id?.toString() || doc.examQuizId?.toString() || null;
    this.examTitle = doc.examQuizId?.title || "";
    this.examPassingPercentage = doc.examPassingPercentage || 70;
    this.examMaxAttempts = doc.examMaxAttempts || 3;
    this.isActive = doc.isActive !== undefined ? doc.isActive : true;
    this.createdAt = doc.createdAt;
  }
}

export class LectureResDTO {
  constructor(entity) {
    const doc = entity.toObject ? entity.toObject() : entity;
    this.id = doc._id?.toString() || doc.id;
    this.courseId = doc.courseId?._id?.toString() || doc.courseId?.toString();
    this.title = doc.title;
    this.description = doc.description || "";
    this.order = doc.order || 1;
    this.videoUrls = Array.isArray(doc.videoUrls) ? doc.videoUrls : [];
    this.isMandatory = doc.isMandatory !== undefined ? doc.isMandatory : true;
    this.durationSeconds = doc.durationSeconds || 0;
    this.isActive = doc.isActive !== undefined ? doc.isActive : true;
    this.createdAt = doc.createdAt;
  }
}

export class EnrollmentResDTO {
  constructor(entity) {
    const doc = entity.toObject ? entity.toObject() : entity;
    this.id = doc._id?.toString() || doc.id;
    this.studentId = doc.studentId?._id?.toString() || doc.studentId?.toString();
    this.studentName = doc.studentId?.name || doc.studentName || "";
    this.studentEmail = doc.studentId?.email || doc.studentEmail || "";
    this.universityId = doc.universityId?._id?.toString() || doc.universityId?.toString();
    this.departmentId = doc.departmentId?._id?.toString() || doc.departmentId?.toString();
    this.departmentName = doc.departmentId?.name || "";
    this.departmentCode = doc.departmentId?.code || "";
    this.batchId = doc.batchId?._id?.toString() || doc.batchId?.toString() || "";
    this.batchYear = doc.batchYear || doc.batchId?.year || 2026;
    this.batchName = doc.batchName || (doc.batchId?.name ? doc.batchId.name : `Batch ${doc.batchYear || 2026}`);
    this.currentSemesterId = doc.currentSemesterId?._id?.toString() || doc.currentSemesterId?.toString();
    this.currentSemesterNumber = doc.currentSemesterNumber || 1;
    this.rollNumber = doc.rollNumber;
    this.status = doc.status || "ACTIVE";
    this.enrolledAt = doc.enrolledAt;
    this.completedSemesters = doc.completedSemesters || [];
  }
}

export class ProgressResDTO {
  constructor(entity) {
    const doc = entity.toObject ? entity.toObject() : entity;
    this.id = doc._id?.toString() || doc.id;
    this.studentId = doc.studentId?._id?.toString() || doc.studentId?.toString();
    this.courseId = doc.courseId?._id?.toString() || doc.courseId?.toString();
    this.lectureId = doc.lectureId?._id?.toString() || doc.lectureId?.toString();
    this.watchedSeconds = doc.watchedSeconds || 0;
    this.totalDurationSeconds = doc.totalDurationSeconds || 0;
    this.lastPositionSeconds = doc.lastPositionSeconds || 0;
    this.isCompleted = Boolean(doc.isCompleted);
    this.completedAt = doc.completedAt;
    this.notes = Array.isArray(doc.notes) ? doc.notes : [];
  }
}

export class CertificateResDTO {
  constructor(entity) {
    const doc = entity.toObject ? entity.toObject() : entity;
    this.id = doc._id?.toString() || doc.id;
    this.studentId = doc.studentId?._id?.toString() || doc.studentId?.toString();
    this.studentName = doc.studentName;
    this.rollNumber = doc.rollNumber;
    this.universityId = doc.universityId?._id?.toString() || doc.universityId?.toString();
    this.departmentId = doc.departmentId?._id?.toString() || doc.departmentId?.toString();
    this.departmentName = doc.departmentId?.name || "";
    this.type = doc.type || "SEMESTER";
    this.certificateNumber = doc.certificateNumber;
    this.title = doc.title;
    this.grade = doc.grade || "PASSED";
    this.status = doc.status || "AWARDED";
    this.issuedDate = doc.issuedDate;
    this.issuedBy = doc.issuedBy || "University Administration";
  }
}

export class MessageResDTO {
  constructor(entity) {
    const doc = entity.toObject ? entity.toObject() : entity;
    this.id = doc._id?.toString() || doc.id;
    this.courseId = doc.courseId?._id?.toString() || doc.courseId?.toString();
    this.studentId = doc.studentId?._id?.toString() || doc.studentId?.toString();
    this.instructorId = doc.instructorId?._id?.toString() || doc.instructorId?.toString();
    this.senderId = doc.senderId?._id?.toString() || doc.senderId?.toString();
    this.senderName = doc.senderName;
    this.senderRole = doc.senderRole;
    this.message = doc.message;
    this.createdAt = doc.createdAt;
  }
}
