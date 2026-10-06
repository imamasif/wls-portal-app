// src/features/wls-assessments/wlsAssessment.schema.js
import { ASSESSMENT_STATUSES } from "../../common/constants/enums.js";

export const submitAssessmentSchema = {
  type: "object",
  properties: {
    sessionId: { type: "string" },
    userId: { type: "string" },
    videoUrl: { type: "string" },
    groupNumber: { type: "number" },
  },
  required: ["sessionId", "userId", "videoUrl"],
  additionalProperties: true,
};

export const gradeAssessmentSchema = {
  type: "object",
  required: ["evaluatorId", "scores"],
  properties: {
    evaluatorId: { type: "string" },
    evaluatorName: { type: "string" },
    feedback: { type: "string" },
    status: {
      type: "string",
      enum: Object.values(ASSESSMENT_STATUSES),
    },
    scores: {
      type: "object",
      additionalProperties: { type: "number" }, // Allows any numeric score keys
    },
  },
};
