export const createBatchAjvSchema = {
  type: "object",
  properties: {
    universityId: { type: "string", minLength: 2 },
    admissionYear: { type: "number" },
    departmentCode: { type: "string", minLength: 2 },
    batchName: { type: "string", minLength: 2 },
  },
  required: ["universityId", "admissionYear", "departmentCode", "batchName"],
  additionalProperties: false,
};
