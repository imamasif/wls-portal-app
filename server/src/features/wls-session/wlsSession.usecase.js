// src/features/wls-session/wlsSession.usecase.js
import { WlsSessionModel } from "./wlsSession.model.js";
import { WlsSessionMapper } from "./wlsSession.mapper.js";
import { WLS_SESSION_STATUSES } from "../../common/constants/enums.js";
import mongoose from "mongoose";
import "../users/user.model.js";

export class WlsSessionUseCase {
  async getAllSessions() {
    const docs = await WlsSessionModel.find().lean().sort({ createdAt: -1 });
    return this._populateAdminNames(docs);
  }

  // NEW: Dedicated method to fetch only active sessions for student/user portals
  async getActiveSessionsForUser() {
    const docs = await WlsSessionModel.find({
      status: WLS_SESSION_STATUSES.ACTIVE,
    })
      .lean()
      .sort({ createdAt: -1 });
    return this._populateAdminNames(docs);
  }

  async _populateAdminNames(docs) {
    const adminIds = new Set();
    docs.forEach((doc) => {
      if (doc.groupAssignments) {
        const assignments =
          doc.groupAssignments instanceof Map
            ? Object.fromEntries(doc.groupAssignments)
            : doc.groupAssignments;

        Object.values(assignments).forEach((group) => {
          group.adminIds?.forEach((id) => adminIds.add(id));
        });
      }
    });

    const User = mongoose.model("User");
    const users = await User.find(
      { _id: { $in: Array.from(adminIds) } },
      "fullName name email",
    ).lean();
    const userMap = new Map(
      users.map((u) => [u._id.toString(), u.fullName || u.name || u.email]),
    );

    docs.forEach((doc) => {
      if (doc.groupAssignments) {
        const assignments =
          doc.groupAssignments instanceof Map
            ? Object.fromEntries(doc.groupAssignments)
            : doc.groupAssignments;

        Object.keys(assignments).forEach((key) => {
          const group = assignments[key];
          if (group.adminIds) {
            group.admins = group.adminIds.map((id) => ({
              id,
              name: userMap.get(id.toString()) || id,
            }));
          }
        });
        doc.groupAssignments = assignments;
      }
    });

    return WlsSessionMapper.toResponseList(docs);
  }

  // Returns ALL non-cancelled sessions (active + completed) for the student view
  async getAllSessionsForUser() {
    const docs = await WlsSessionModel.find({
      status: { $nin: ["CANCELLED", "CANCELED"] },
    })
      .lean()
      .sort({ sessionDateTimeToronto: -1 });
    return this._populateAdminNames(docs);
  }

  async createSession(dto) {
    if (dto.sessionDateTimeToronto) {
      const incoming = new Date(dto.sessionDateTimeToronto);
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      if (incoming < startOfToday) {
        throw new Error(
          "Session date cannot be prior to today's date. Backdated sessions are not allowed."
        );
      }
    }

    // Enforce only ONE active session at a time across the entire portal
    if (dto.status === WLS_SESSION_STATUSES.ACTIVE) {
      await WlsSessionModel.updateMany(
        { status: WLS_SESSION_STATUSES.ACTIVE },
        { $set: { status: WLS_SESSION_STATUSES.COMPLETED } },
      );
    }

    const created = await WlsSessionModel.create(dto);
    return WlsSessionMapper.toResponse(created);
  }

  async updateStatus(id, status, cancelReason = "") {
    const allowedStatuses = Object.values(WLS_SESSION_STATUSES);
    if (!allowedStatuses.includes(status)) {
      throw new Error("Invalid session status value.");
    }

    if (status === WLS_SESSION_STATUSES.ACTIVE) {
      await WlsSessionModel.updateMany(
        { status: WLS_SESSION_STATUSES.ACTIVE, _id: { $ne: id } },
        { $set: { status: WLS_SESSION_STATUSES.COMPLETED } },
      );
    }

    const updated = await WlsSessionModel.findByIdAndUpdate(
      id,
      { status, cancelReason },
      { new: true, runValidators: true },
    );

    if (!updated) {
      throw new Error("WLS Session not found.");
    }

    return WlsSessionMapper.toResponse(updated);
  }

  async deleteSession(id) {
    await WlsSessionModel.findByIdAndDelete(id);
    return { success: true };
  }

  async addComment(sessionId, comment) {
    const updated = await WlsSessionModel.findByIdAndUpdate(
      sessionId,
      { $push: { comments: comment } },
      { new: true, runValidators: true },
    );
    if (!updated) throw new Error("WLS Session not found.");
    return WlsSessionMapper.toResponse(updated);
  }

  async updateSession(id, dto) {
    if (dto.sessionDateTimeToronto) {
      const incoming = new Date(dto.sessionDateTimeToronto);
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      if (incoming < startOfToday) {
        throw new Error(
          "Session date cannot be prior to today's date. Backdated sessions are not allowed."
        );
      }
    }

    // Enforce only ONE active session at a time
    if (dto.status === WLS_SESSION_STATUSES.ACTIVE) {
      await WlsSessionModel.updateMany(
        { status: WLS_SESSION_STATUSES.ACTIVE, _id: { $ne: id } },
        { $set: { status: WLS_SESSION_STATUSES.COMPLETED } },
      );
    }

    const updated = await WlsSessionModel.findByIdAndUpdate(
      id,
      {
        topicName: dto.topicName,
        sessionDateTimeToronto: dto.sessionDateTimeToronto,
        description: dto.description,
        videoDeadline: dto.videoDeadline,
        pdfBookletUrls: dto.pdfBookletUrls,
        quranVideoUrls: dto.quranVideoUrls,
        groupAssignments: dto.groupAssignments,
        status: dto.status,
      },
      { new: true, runValidators: true },
    );

    if (!updated) {
      throw new Error("WLS Session not found");
    }

    return WlsSessionMapper.toResponse(updated);
  }
}

