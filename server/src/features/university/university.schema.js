export const createUniversitySchema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 3 },
    code: { type: "string", minLength: 2, maxLength: 12 },
    description: { type: "string" },
    logoUrl: { type: "string" },
    foundedYear: { type: "number" },
    address: { type: "string" },
    contactEmail: { type: "string", format: "email" },
    contactPhone: { type: "string" },
    isActive: { type: "boolean" },
  },
  required: ["name", "code"],
  additionalProperties: true,
};

export const updateUniversitySchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    code: { type: "string" },
    description: { type: "string" },
    logoUrl: { type: "string" },
    foundedYear: { type: "number" },
    address: { type: "string" },
    contactEmail: { type: "string" },
    contactPhone: { type: "string" },
    isActive: { type: "boolean" },
  },
  additionalProperties: true,
};

export const createDepartmentSchema = {
  type: "object",
  properties: {
    universityId: { type: "string" },
    name: { type: "string", minLength: 2 },
    code: { type: "string", minLength: 2, maxLength: 10 },
    description: { type: "string" },
    headOfDepartment: { type: "string" },
    totalSemesters: { type: "number", minimum: 1, maximum: 12 },
    isActive: { type: "boolean" },
  },
  required: ["name", "code"],
  additionalProperties: true,
};

export const updateDepartmentSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    code: { type: "string" },
    description: { type: "string" },
    headOfDepartment: { type: "string" },
    totalSemesters: { type: "number" },
    isActive: { type: "boolean" },
  },
  additionalProperties: true,
};

export const createSemesterSchema = {
  type: "object",
  properties: {
    universityId: { type: "string" },
    departmentId: { type: "string" },
    semesterNumber: { type: "number", minimum: 1, maximum: 12 },
    title: { type: "string", minLength: 2 },
    academicYear: { type: "string" },
    startDate: { type: "string" },
    endDate: { type: "string" },
    isActive: { type: "boolean" },
  },
  required: ["departmentId", "semesterNumber", "title"],
  additionalProperties: true,
};

export const updateSemesterSchema = {
  type: "object",
  properties: {
    semesterNumber: { type: "number" },
    title: { type: "string" },
    academicYear: { type: "string" },
    startDate: { type: "string" },
    endDate: { type: "string" },
    isActive: { type: "boolean" },
  },
  additionalProperties: true,
};

export const createCourseSchema = {
  type: "object",
  properties: {
    universityId: { type: "string" },
    departmentId: { type: "string" },
    semesterId: { type: "string" },
    title: { type: "string", minLength: 2 },
    code: { type: "string", minLength: 2 },
    description: { type: "string" },
    credits: { type: "number" },
    instructorId: { type: "string" },
    instructorName: { type: "string" },
    isExamAvailable: { type: "boolean" },
    examQuizId: { type: "string" },
    examPassingPercentage: { type: "number", minimum: 0, maximum: 100 },
    examMaxAttempts: { type: "number", minimum: 1 },
    isActive: { type: "boolean" },
  },
  required: ["departmentId", "semesterId", "title", "code"],
  additionalProperties: true,
};

export const updateCourseSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    code: { type: "string" },
    description: { type: "string" },
    credits: { type: "number" },
    instructorId: { type: "string" },
    instructorName: { type: "string" },
    isExamAvailable: { type: "boolean" },
    examQuizId: { type: "string" },
    examPassingPercentage: { type: "number" },
    examMaxAttempts: { type: "number" },
    isActive: { type: "boolean" },
  },
  additionalProperties: true,
};

export const createLectureSchema = {
  type: "object",
  properties: {
    courseId: { type: "string" },
    title: { type: "string", minLength: 2 },
    description: { type: "string" },
    order: { type: "number" },
    videoUrls: { type: "array", items: { type: "string" } },
    isMandatory: { type: "boolean" },
    durationSeconds: { type: "number" },
    isActive: { type: "boolean" },
  },
  required: ["courseId", "title"],
  additionalProperties: true,
};

export const updateLectureSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    order: { type: "number" },
    videoUrls: { type: "array", items: { type: "string" } },
    isMandatory: { type: "boolean" },
    durationSeconds: { type: "number" },
    isActive: { type: "boolean" },
  },
  additionalProperties: true,
};

export const enrollStudentSchema = {
  type: "object",
  properties: {
    studentId: { type: "string" },
    departmentId: { type: "string" },
    semesterId: { type: "string" },
    customRollNumber: { type: "string" },
  },
  required: ["studentId", "departmentId"],
  additionalProperties: true,
};

export const updateProgressSchema = {
  type: "object",
  properties: {
    studentId: { type: "string" },
    courseId: { type: "string" },
    lectureId: { type: "string" },
    watchedSeconds: { type: "number" },
    totalDurationSeconds: { type: "number" },
    lastPositionSeconds: { type: "number" },
    markComplete: { type: "boolean" },
  },
  required: ["studentId", "courseId", "lectureId"],
  additionalProperties: true,
};

export const submitExamAttemptSchema = {
  type: "object",
  properties: {
    studentId: { type: "string" },
    courseId: { type: "string" },
    quizId: { type: "string" },
    answers: { type: "array" },
    score: { type: "number" },
    maxScore: { type: "number" },
    percentage: { type: "number" },
  },
  required: ["studentId", "courseId", "quizId"],
  additionalProperties: true,
};

export const awardCertificateSchema = {
  type: "object",
  properties: {
    studentId: { type: "string" },
    departmentId: { type: "string" },
    semesterId: { type: "string" },
    courseId: { type: "string" },
    type: { type: "string", enum: ["SEMESTER", "COURSE", "DEGREE"] },
    title: { type: "string" },
    grade: { type: "string" },
  },
  required: ["studentId", "departmentId", "title"],
  additionalProperties: true,
};

export const sendMessageSchema = {
  type: "object",
  properties: {
    courseId: { type: "string" },
    studentId: { type: "string" },
    instructorId: { type: "string" },
    senderId: { type: "string" },
    senderName: { type: "string" },
    senderRole: { type: "string" },
    message: { type: "string", minLength: 1 },
  },
  required: ["courseId", "studentId", "message"],
  additionalProperties: true,
};
