export const createUniversityAjvSchema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 2 },
    code: { type: "string", minLength: 2, uppercase: true },
    foundedYear: { type: "number" },
    active: { type: "boolean" },
  },
  required: ["code"],
  additionalProperties: false,
};
