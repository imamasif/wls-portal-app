export const createCourseAjvSchema = {
  type: "object",
  properties: {
    title: { type: "string", minLength: 3 },
    semesterId: { type: "string" },
    active: { type: "boolean" },
  },
  required: ["title"],
  additionalProperties: false,
};
