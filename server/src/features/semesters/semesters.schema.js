export const createSemesterAjvSchema = {
  type: "object",
  properties: {
    semesterNumber: { type: "number" },
    title: { type: "string", minLength: 2 },
    courses: { type: "array", items: { type: "string" } },
  },
  required: ["semesterNumber", "title"],
  additionalProperties: false,
};
