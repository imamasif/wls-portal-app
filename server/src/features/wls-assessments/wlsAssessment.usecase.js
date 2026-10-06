import mongoose from "mongoose";
import { AssessmentModel } from "./wlsAssessment.model.js";
import { WlsSessionModel } from "../wls-session/wlsSession.model.js";
import {
  ASSESSMENT_STATUSES,
  CONCLUSION_STATUSES,
} from "../../common/constants/enums.js";

const REQUIRED_COMPLETED_EVALUATIONS = process.env
  .REQUIRED_COMPLETED_EVALUATIONS
  ? parseInt(process.env.REQUIRED_COMPLETED_EVALUATIONS, 10)
  : 1;

export class AssessmentUseCase {
  static async getAllAssessments() {
    return await AssessmentModel.find({})
      .populate("userId", "name email profilePictureUrl city country")
      .populate("sessionId", "weekNumber topicName status");
  }

  static async getAssessmentById(id) {
    return await AssessmentModel.findById(id)
      .populate("userId", "name email profilePictureUrl city country")
      .populate("sessionId", "weekNumber topicName status");
  }

  // Ensures assessment is only created/accessed if session is ACTIVE
  static async getOrCreateAssessment(sessionId, userId) {
    const sessionObjId = new mongoose.Types.ObjectId(sessionId);
    const userObjId = new mongoose.Types.ObjectId(userId);

    const session = await WlsSessionModel.findById(sessionObjId);
    if (!session || session.status !== "ACTIVE") {
      throw new Error(
        "Cannot access assessments for a session that is not active.",
      );
    }

    return await AssessmentModel.findOneAndUpdate(
      { sessionId: sessionObjId, userId: userObjId },
      {
        $setOnInsert: {
          status: ASSESSMENT_STATUSES.PENDING,
          submissionUrl: "",
          messages: [],
          evaluations: [],
          groupNumber: 1,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    )
      .populate("userId", "name email profilePictureUrl city country")
      .populate("sessionId", "weekNumber topicName status");
  }

  static async getUserSubmissions(userId) {
    const assessments = await AssessmentModel.find({ userId }).populate(
      "sessionId",
      "weekNumber topicName status",
    );

    // Filter out submissions belonging to non-active sessions so they don't show up prematurely
    return assessments.filter(
      (assessment) =>
        assessment.sessionId && assessment.sessionId.status === "ACTIVE",
    );
  }

  static async submitVideoLink(dto) {
    const { sessionId, userId, videoUrl, submissionUrl, groupNumber } = dto;
    const urlToSave = submissionUrl || videoUrl;

    if (!urlToSave) {
      throw new Error("A valid video or submission URL is required.");
    }

    const session = await WlsSessionModel.findById(sessionId);
    if (!session || session.status !== "ACTIVE") {
      throw new Error("Submissions are only allowed for active sessions.");
    }

    const updatedAssessment = await AssessmentModel.findOneAndUpdate(
      { sessionId, userId },
      {
        $set: {
          submissionUrl: urlToSave,
          submissionUrls: [urlToSave],
          groupNumber: groupNumber || 1,
          status: ASSESSMENT_STATUSES.SUBMITTED,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    return updatedAssessment;
  }

  static async gradeSubmission(assessmentId, dto) {
    const assessment = await AssessmentModel.findById(assessmentId);
    if (!assessment) return null;

    // 1. Remove existing evaluation from this evaluator
    assessment.evaluations = assessment.evaluations.filter(
      (e) =>
        e.evaluatorId &&
        e.evaluatorId.toString() !== dto.evaluatorId.toString(),
    );

    const currentAdminStatus = dto.status || ASSESSMENT_STATUSES.COMPLETED;

    // 2. Add new evaluation entry with evaluator's status
    assessment.evaluations.push({
      evaluatorId: dto.evaluatorId,
      evaluatorName: dto.evaluatorName,
      scores: dto.scores,
      feedback: dto.feedback,
      status: currentAdminStatus,
      evaluatedAt: new Date(),
    });

    // 3. Compute merged scores
    let totalObtained = 0;
    let totalPossible = 0;

    assessment.evaluations.forEach((ev) => {
      const scores =
        ev.scores instanceof Map
          ? Object.fromEntries(ev.scores)
          : ev.scores || {};
      Object.values(scores).forEach((val) => {
        totalObtained += Number(val) || 0;
        totalPossible += 10;
      });
    });

    const percentage =
      totalPossible > 0 ? Math.round((totalObtained / totalPossible) * 100) : 0;

    assessment.finalScore = percentage;
    assessment.conclusionStatus =
      assessment.finalScore >= 70
        ? CONCLUSION_STATUSES.PASSED
        : CONCLUSION_STATUSES.FAILED;

    // 4. Threshold check for overall status across all admins
    const completedCount = assessment.evaluations.filter(
      (e) => e.status === ASSESSMENT_STATUSES.COMPLETED,
    ).length;

    if (completedCount >= REQUIRED_COMPLETED_EVALUATIONS) {
      assessment.status = ASSESSMENT_STATUSES.COMPLETED;
    } else if (assessment.evaluations.length > 0) {
      assessment.status = ASSESSMENT_STATUSES.PARTIAL_SAVED;
    }

    return await assessment.save();
  }

  static async markAsCompleted(assessmentId) {
    const assessment = await AssessmentModel.findById(assessmentId);
    if (!assessment || !assessment.submissionUrl) {
      throw new Error("Cannot mark as completed without a video submission.");
    }

    assessment.status = ASSESSMENT_STATUSES.SUBMITTED;
    assessment.completedAt = new Date();
    return await assessment.save();
  }

  static async addMessage(assessmentId, dto) {
    const assessment = await AssessmentModel.findById(assessmentId);
    if (!assessment) return null;

    assessment.messages.push({
      senderId: dto.senderId,
      senderName: dto.senderName,
      senderRole: dto.senderRole,
      text: dto.text,
      timestamp: new Date(),
    });

    return await assessment.save();
  }
}

export const assessmentUseCase = AssessmentUseCase;
