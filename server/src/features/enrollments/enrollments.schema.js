export const createEnrollmentAjvSchema = {
  type: "object",
  properties: {
    userId: { type: "string" },
    universityId: { type: "string" },
    batchId: { type: "string" },
    rollNumber: { type: "string", pattern: "^[0-9]{4}-[A-Z]+-[0-9]+$" },
    enrolledCourseId: { type: "string" },
    assignedSemesterId: { type: "string" },
  },
  required: [
    "userId",
    "universityId",
    "batchId",
    "rollNumber",
    "enrolledCourseId",
    "assignedSemesterId",
  ],
  additionalProperties: false,
};
