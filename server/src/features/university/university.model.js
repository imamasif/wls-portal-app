import mongoose from "mongoose";

// 1. UNIVERSITY MODEL
const UniversitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      default: "International Islamic Propagation Center (IIPC) University",
    },
    code: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      uppercase: true,
      default: "IIPC-U",
    },
    description: {
      type: String,
      default:
        "Global Islamic & Technical University offering systematic Quranic, Arabic, and Islamic studies.",
    },
    logoUrl: { type: String, default: "" },
    foundedYear: { type: Number, default: 2026 },
    address: { type: String, default: "Canada" },
    contactEmail: { type: String, default: "info@iipc.ca" },
    contactPhone: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String, default: "super_user" },
  },
  { timestamps: true }
);

// 2. DEPARTMENT MODEL
const DepartmentSchema = new mongoose.Schema(
  {
    universityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "University",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true }, // e.g. 'QA', 'IS', 'CS'
    description: { type: String, default: "" },
    headOfDepartment: { type: String, default: "" },
    totalSemesters: { type: Number, default: 8, min: 1, max: 12 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
DepartmentSchema.index({ universityId: 1, code: 1 }, { unique: true });

// 3. SEMESTER MODEL
const SemesterSchema = new mongoose.Schema(
  {
    universityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "University",
      required: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UniversityDepartment",
      required: true,
    },
    semesterNumber: { type: Number, required: true, min: 1, max: 12 },
    title: { type: String, required: true, trim: true }, // e.g. "Semester 1 - Foundation"
    academicYear: { type: String, default: "2026-2027", trim: true },
    startDate: { type: Date },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
SemesterSchema.index(
  { departmentId: 1, semesterNumber: 1, academicYear: 1 },
  { unique: true }
);

// 4. COURSE MODEL
const CourseSchema = new mongoose.Schema(
  {
    universityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "University",
      required: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UniversityDepartment",
      required: true,
    },
    semesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UniversitySemester",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true }, // e.g. 'QA-101'
    description: { type: String, default: "" },
    credits: { type: Number, default: 3 },
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    instructorName: { type: String, default: "" },
    isExamAvailable: { type: Boolean, default: false }, // Controlled by university_super_user
    examQuizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" }, // Linked to existing Quiz
    examPassingPercentage: { type: Number, default: 70 },
    examMaxAttempts: { type: Number, default: 3 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
CourseSchema.index({ departmentId: 1, code: 1 }, { unique: true });

// 5. LECTURE MODEL
const LectureSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UniversityCourse",
      required: true,
    },
    topicName: { type: String, default: "General", trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    order: { type: Number, default: 1 },
    videoUrls: [{ type: String, trim: true }], // Array of video URLs
    isMandatory: { type: Boolean, default: true }, // true: must watch end-to-end; false: optional
    durationSeconds: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
LectureSchema.index({ courseId: 1, order: 1 });

// 6. STUDENT ENROLLMENT MODEL
const StudentEnrollmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    studentName: { type: String, required: true },
    studentEmail: { type: String, required: true, lowercase: true, trim: true },
    universityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "University",
      required: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UniversityDepartment",
      required: true,
    },
    currentSemesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UniversitySemester",
      required: true,
    },
    currentSemesterNumber: { type: Number, default: 1 },
    rollNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    }, // Format: YYYY-DEPT-ROLL# (e.g. 2026-QA-073)
    status: {
      type: String,
      enum: ["ENROLLED", "ACTIVE", "PROMOTED", "GRADUATED", "SUSPENDED"],
      default: "ACTIVE",
    },
    enrolledAt: { type: Date, default: Date.now },
    completedSemesters: [{ type: Number }],
  },
  { timestamps: true }
);
StudentEnrollmentSchema.index(
  { studentId: 1, departmentId: 1 },
  { unique: true }
);

// 7. STUDENT LECTURE PROGRESS (Anti-cheat, end-to-end watch tracking)
const StudentLectureProgressSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UniversityCourse",
      required: true,
    },
    lectureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UniversityLecture",
      required: true,
    },
    watchedSeconds: { type: Number, default: 0 },
    totalDurationSeconds: { type: Number, default: 0 },
    lastPositionSeconds: { type: Number, default: 0 },
    isCompleted: { type: Boolean, default: false }, // true once watched end-to-end
    completedAt: { type: Date },
    notes: [
      {
        noteId: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
        text: { type: String, required: true },
        timestampSeconds: { type: Number, default: 0 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);
StudentLectureProgressSchema.index(
  { studentId: 1, lectureId: 1 },
  { unique: true }
);

// 8. STUDENT EXAM ATTEMPT MODEL
const StudentExamAttemptSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    studentName: { type: String, required: true },
    rollNumber: { type: String, required: true },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UniversityCourse",
      required: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    quizSubmissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuizSubmission",
    },
    attemptNumber: { type: Number, default: 1 },
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 100 },
    percentage: { type: Number, default: 0 },
    isPassed: { type: Boolean, default: false },
    answers: [{ type: mongoose.Schema.Types.Mixed }],
    attemptedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
StudentExamAttemptSchema.index(
  { studentId: 1, courseId: 1, attemptNumber: 1 },
  { unique: true }
);

// 9. CERTIFICATE MODEL
const CertificateSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    studentName: { type: String, required: true },
    rollNumber: { type: String, required: true },
    universityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "University",
      required: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UniversityDepartment",
      required: true,
    },
    semesterId: { type: mongoose.Schema.Types.ObjectId, ref: "UniversitySemester" },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "UniversityCourse" },
    type: {
      type: String,
      enum: ["SEMESTER", "COURSE", "DEGREE"],
      default: "SEMESTER",
    },
    certificateNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    }, // e.g. CERT-2026-QA-S1-073
    title: { type: String, required: true },
    grade: { type: String, default: "PASSED" },
    status: {
      type: String,
      enum: ["AWARDED", "REVOKED"],
      default: "AWARDED",
    },
    issuedDate: { type: Date, default: Date.now },
    issuedBy: { type: String, default: "University Administration" },
  },
  { timestamps: true }
);

// 10. UNIVERSITY 1-ON-1 MESSAGING (Student <-> Instructor)
const UniversityMessageSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UniversityCourse",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderName: { type: String, required: true },
    senderRole: { type: String, required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
UniversityMessageSchema.index({
  courseId: 1,
  studentId: 1,
  createdAt: 1,
});

export const UniversityModel =
  mongoose.models.University || mongoose.model("University", UniversitySchema);

export const DepartmentModel =
  mongoose.models.UniversityDepartment ||
  mongoose.model("UniversityDepartment", DepartmentSchema);

export const SemesterModel =
  mongoose.models.UniversitySemester ||
  mongoose.model("UniversitySemester", SemesterSchema);

export const CourseModel =
  mongoose.models.UniversityCourse ||
  mongoose.model("UniversityCourse", CourseSchema);

export const LectureModel =
  mongoose.models.UniversityLecture ||
  mongoose.model("UniversityLecture", LectureSchema);

export const StudentEnrollmentModel =
  mongoose.models.UniversityEnrollment ||
  mongoose.model("UniversityEnrollment", StudentEnrollmentSchema);

export const StudentLectureProgressModel =
  mongoose.models.UniversityLectureProgress ||
  mongoose.model("UniversityLectureProgress", StudentLectureProgressSchema);

export const StudentExamAttemptModel =
  mongoose.models.UniversityExamAttempt ||
  mongoose.model("UniversityExamAttempt", StudentExamAttemptSchema);

export const CertificateModel =
  mongoose.models.UniversityCertificate ||
  mongoose.model("UniversityCertificate", CertificateSchema);

export const UniversityMessageModel =
  mongoose.models.UniversityMessage ||
  mongoose.model("UniversityMessage", UniversityMessageSchema);
