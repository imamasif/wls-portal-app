// src/features/wls-assessments/wlsAssessment.usecase.js
import mongoose from "mongoose";
import { AssessmentModel } from "./wlsAssessment.model.js";
import { WlsSessionModel } from "../wls-session/wlsSession.model.js";
import {
  ASSESSMENT_STATUSES,
  CONCLUSION_STATUSES,
} from "../../common/constants/enums.js";
import { UserRole } from "../types/user.js";

export class AssessmentUseCase {
  /**
   * Helper to verify if a user is assigned as a submitter or admin in any group of a session,
   * or has SUPER_USER / WLS_ADMIN role.
   */
  static async _isUserAssignedToSession(session, userId) {
    if (!session || !session.groupAssignments) return false;

    const userIdStr = String(userId).trim();

    try {
      const User = mongoose.model("User");
      const userDoc = await User.findById(userIdStr).lean();
      if (
        userDoc &&
        (userDoc.role === "SUPER_USER" || userDoc.role === "WLS_ADMIN")
      ) {
        return true;
      }
    } catch (e) {}

    const assignments =
      session.groupAssignments instanceof Map
        ? Object.fromEntries(session.groupAssignments)
        : session.groupAssignments;

    return Object.values(assignments).some(
      (group) =>
        (Array.isArray(group.userIds) &&
          group.userIds.some((id) => String(id).trim() === userIdStr)) ||
        (Array.isArray(group.adminIds) &&
          group.adminIds.some((id) => String(id).trim() === userIdStr)),
    );
  }

  static async getAllAssessments() {
    return await AssessmentModel.find({})
      .populate("userId", "name email profilePictureUrl city country role")
      .populate("sessionId", "weekNumber topicName status");
  }

  static async getAssessmentById(id) {
    return await AssessmentModel.findById(id)
      .populate("userId", "name email profilePictureUrl city country role")
      .populate("sessionId", "weekNumber topicName status");
  }

  // Ensures assessment is accessed/created for any active or completed session
  static async getOrCreateAssessment(sessionId, userId) {
    const sessionObjId = new mongoose.Types.ObjectId(sessionId);
    const userObjId = new mongoose.Types.ObjectId(userId);

    const session = await WlsSessionModel.findById(sessionObjId);
    if (!session) {
      throw new Error("WLS Session not found.");
    }
    if (session.status === "CANCELLED" || session.status === "CANCELED") {
      throw new Error("Cannot access assessments for a cancelled session.");
    }

    const isAssigned = await this._isUserAssignedToSession(session, userId);
    if (!isAssigned) {
      throw new Error(
        "User is not assigned to submit an assignment for this session.",
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
      .populate("userId", "name email profilePictureUrl city country role")
      .populate("sessionId", "weekNumber topicName status");
  }

  static async getUserSubmissions(userId) {
    const assessments = await AssessmentModel.find({ userId }).populate(
      "sessionId",
      "weekNumber topicName status",
    );

    return assessments.filter(
      (assessment) =>
        assessment.sessionId &&
        assessment.sessionId.status !== "CANCELLED" &&
        assessment.sessionId.status !== "CANCELED",
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

    const isAssigned = await this._isUserAssignedToSession(session, userId);
    if (!isAssigned) {
      throw new Error(
        "Unauthorized: You are not assigned to submit an assignment for this session.",
      );
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

    // 1. Save Admin Video Override URL if provided
    if (dto.adminSubmissionUrl && dto.adminSubmissionUrl.trim() !== "") {
      const overrideUrl = dto.adminSubmissionUrl.trim();
      assessment.submissionUrl = overrideUrl;
      if (
        !assessment.submissionUrls ||
        assessment.submissionUrls.length === 0
      ) {
        assessment.submissionUrls = [overrideUrl];
      } else if (!assessment.submissionUrls.includes(overrideUrl)) {
        assessment.submissionUrls.push(overrideUrl);
      }
    }

    // 2. Remove previous evaluation for THIS evaluator
    assessment.evaluations = assessment.evaluations.filter(
      (e) =>
        e.evaluatorId &&
        e.evaluatorId.toString() !== dto.evaluatorId.toString(),
    );

    // Determine individual admin evaluation status
    const myAdminStatus =
      dto.status === "COMPLETED" || dto.status === "REVIEWED"
        ? ASSESSMENT_STATUSES.REVIEWED
        : ASSESSMENT_STATUSES.PARTIAL_SAVED;

    // 3. Add updated evaluation entry for THIS admin
    assessment.evaluations.push({
      evaluatorId: dto.evaluatorId,
      evaluatorName: dto.evaluatorName,
      scores: dto.scores,
      feedback: dto.feedback,
      adminSubmissionUrl: dto.adminSubmissionUrl || "",
      status: myAdminStatus, // Stores THIS admin's status
      evaluatedAt: new Date(),
    });

    // 4. Recalculate merged average scores
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

    // Top-level status changes to UNDER_REVIEW when any admin saves or partial-saves ranking, until Super User finalizes to COMPLETED
    if (assessment.status !== ASSESSMENT_STATUSES.COMPLETED) {
      assessment.status = ASSESSMENT_STATUSES.UNDER_REVIEW;
    }

    return await assessment.save();
  }

  // --- Start Review Method (transitions SUBMITTED/PENDING to UNDER_REVIEW) ---
  static async startReview(assessmentId) {
    const assessment = await AssessmentModel.findById(assessmentId);
    if (!assessment) return null;

    if (
      assessment.status !== ASSESSMENT_STATUSES.COMPLETED &&
      assessment.status !== ASSESSMENT_STATUSES.UNDER_REVIEW
    ) {
      assessment.status = ASSESSMENT_STATUSES.UNDER_REVIEW;
      return await assessment.save();
    }
    return assessment;
  }

  // --- Super User Completion Method ---
  static async finalizeAssessmentBySuperUser(assessmentId, requestingUserRole) {
    if (requestingUserRole !== UserRole.SUPER_USER) {
      throw new Error(
        "Forbidden: Only a Super User can mark an assessment task as completed.",
      );
    }

    const assessment = await AssessmentModel.findById(assessmentId);
    if (!assessment) return null;

    // Verify video stream exists either in submissionUrl or evaluations array
    const hasVideo =
      assessment.submissionUrl ||
      (assessment.submissionUrls && assessment.submissionUrls.length > 0) ||
      assessment.evaluations?.some((e) => e.adminSubmissionUrl);

    if (!hasVideo) {
      throw new Error(
        "Cannot finalize assessment without a video submission or Admin Video Override.",
      );
    }

    assessment.status = ASSESSMENT_STATUSES.COMPLETED;
    return await assessment.save();
  }

  static async markAsCompleted(assessmentId) {
    const assessment = await AssessmentModel.findById(assessmentId);
    if (!assessment || !assessment.submissionUrl) {
      throw new Error("Cannot mark as completed without a video submission.");
    }

    assessment.status = ASSESSMENT_STATUSES.SUBMITTED;
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
