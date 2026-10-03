import mongoose from "mongoose";
import {
  ASSESSMENT_STATUSES,
  CONCLUSION_STATUSES,
} from "../../common/constants/enums.js";

const evaluationSchema = new mongoose.Schema(
  {
    evaluatorId: { type: mongoose.Schema.Types.Mixed, required: true },
    evaluatorName: { type: String, required: true },
    scores: {
      type: Map,
      of: Number,
      default: {},
    },
    feedback: { type: String, default: "" },
    evaluatedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const assessmentMessageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.Mixed, required: true },
    senderName: { type: String, required: true },
    senderRole: {
      type: String,
      enum: ["USER", "WLS_ADMIN", "SUPER_USER"],
      default: "USER",
    },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true },
);

const AssessmentSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WlsSession",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    groupNumber: { type: Number, default: 1 },
    submissionUrl: { type: String, default: "" },
    submissionUrls: [{ type: String }],
    missedReason: { type: String, default: "" },
    status: {
      type: String,
      enum: Object.values(ASSESSMENT_STATUSES),
      default: ASSESSMENT_STATUSES.PENDING,
    },
    evaluations: [evaluationSchema],
    messages: [assessmentMessageSchema],
    finalScore: { type: Number, default: 0 },
    conclusionStatus: {
      type: String,
      enum: Object.values(CONCLUSION_STATUSES),
      default: CONCLUSION_STATUSES.PENDING,
    },
  },
  { timestamps: true },
);

AssessmentSchema.index({ sessionId: 1, userId: 1 }, { unique: true });

export const AssessmentModel = mongoose.model("Assessment", AssessmentSchema);
