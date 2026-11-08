export class UniversityResDTO {
  constructor(entity) {
    const doc = entity.toObject ? entity.toObject() : entity;
    this.id = doc._id?.toString() || doc.id;
    this.name = doc.name;
    this.code = doc.code;
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
    this.universityId = doc.universityId?.toString();
    this.name = doc.name;
    this.code = doc.code;
    this.description = doc.description || "";
    this.headOfDepartment = doc.headOfDepartment || "";
    this.totalSemesters = doc.totalSemesters || 8;
    this.isActive = doc.isActive !== undefined ? doc.isActive : true;
    this.createdAt = doc.createdAt;
  }
}

export class SemesterResDTO {
  constructor(entity) {
    const doc = entity.toObject ? entity.toObject() : entity;
    this.id = doc._id?.toString() || doc.id;
    this.universityId = doc.universityId?.toString();
    this.departmentId = doc.departmentId?.toString();
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
    this.universityId = doc.universityId?.toString();
    this.departmentId = doc.departmentId?.toString();
    this.semesterId = doc.semesterId?.toString();
    this.title = doc.title;
    this.code = doc.code;
    this.description = doc.description || "";
    this.credits = doc.credits || 3;
    this.instructorId = doc.instructorId?.toString();
    this.instructorName = doc.instructorName || "";
    this.isExamAvailable = Boolean(doc.isExamAvailable);
    this.examQuizId = doc.examQuizId?.toString() || null;
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
    this.courseId = doc.courseId?.toString();
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
    this.universityId = doc.universityId?.toString();
    this.departmentId = doc.departmentId?._id?.toString() || doc.departmentId?.toString();
    this.departmentName = doc.departmentId?.name || "";
    this.departmentCode = doc.departmentId?.code || "";
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
    this.studentId = doc.studentId?.toString();
    this.courseId = doc.courseId?.toString();
    this.lectureId = doc.lectureId?.toString();
    this.watchedSeconds = doc.watchedSeconds || 0;
    this.totalDurationSeconds = doc.totalDurationSeconds || 0;
    this.lastPositionSeconds = doc.lastPositionSeconds || 0;
    this.isCompleted = Boolean(doc.isCompleted);
    this.completedAt = doc.completedAt;
  }
}

export class CertificateResDTO {
  constructor(entity) {
    const doc = entity.toObject ? entity.toObject() : entity;
    this.id = doc._id?.toString() || doc.id;
    this.studentId = doc.studentId?.toString();
    this.studentName = doc.studentName;
    this.rollNumber = doc.rollNumber;
    this.universityId = doc.universityId?.toString();
    this.departmentId = doc.departmentId?.toString();
    this.semesterId = doc.semesterId?.toString();
    this.courseId = doc.courseId?.toString();
    this.type = doc.type;
    this.certificateNumber = doc.certificateNumber;
    this.title = doc.title;
    this.grade = doc.grade || "PASSED";
    this.status = doc.status || "AWARDED";
    this.issuedDate = doc.issuedDate;
    this.issuedBy = doc.issuedBy;
  }
}

export class MessageResDTO {
  constructor(entity) {
    const doc = entity.toObject ? entity.toObject() : entity;
    this.id = doc._id?.toString() || doc.id;
    this.courseId = doc.courseId?.toString();
    this.studentId = doc.studentId?.toString();
    this.instructorId = doc.instructorId?.toString();
    this.senderId = doc.senderId?.toString();
    this.senderName = doc.senderName;
    this.senderRole = doc.senderRole;
    this.message = doc.message;
    this.createdAt = doc.createdAt;
  }
}
