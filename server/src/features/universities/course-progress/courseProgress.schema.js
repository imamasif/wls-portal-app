// server/src/features/universities/course-progress/courseProgress.schema.js
export const courseProgressAjvSchema = {
  type: "object",
  properties: {
    studentId: { type: "string", minLength: 1 },
    courseId: { type: "string", minLength: 1 },
    lectureId: { type: "string", minLength: 1 },
    watchedMinutes: { type: "number", minimum: 0 },
    isCompleted: { type: "boolean" },
  },
  required: [
    "studentId",
    "courseId",
    "lectureId",
    "watchedMinutes",
    "isCompleted",
  ],
  additionalProperties: false,
};
