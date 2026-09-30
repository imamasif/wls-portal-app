export const toggleAttendanceSchema = {
  type: "object",
  required: ["sessionId", "isAttendanceOpen", "adminId"],
  properties: {
    sessionId: { type: "string" },
    isAttendanceOpen: { type: "boolean" },
    adminId: { type: "string" },
  },
  additionalProperties: true,
};

export const markAttendanceSchema = {
  type: "object",
  required: ["sessionId", "userId"],
  properties: {
    sessionId: { type: "string" },
    userId: { type: "string" },
  },
  additionalProperties: true,
};
