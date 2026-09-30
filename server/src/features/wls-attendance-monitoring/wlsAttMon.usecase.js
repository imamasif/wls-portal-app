import mongoose from "mongoose";
import {
  AttendanceRecordModel,
  AttendanceConfigModel,
} from "./wlsAttMon.model.js";
import { WlsSessionModel } from "../wls-session/wlsSession.model.js";
import { AttendanceMapper } from "./wlsAttMon.mapper.js";

export class AttendanceUseCase {
  static async getOrCreateConfig(sessionId) {
    const sessionObjId = new mongoose.Types.ObjectId(sessionId);
    return await AttendanceConfigModel.findOneAndUpdate(
      { sessionId: sessionObjId },
      { $setOnInsert: { isAttendanceOpen: false } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  }

  static async toggleAttendance(dto) {
    const sessionObjId = new mongoose.Types.ObjectId(dto.sessionId);
    const updateData = {
      isAttendanceOpen: dto.isAttendanceOpen,
      openedBy: dto.adminId,
    };

    if (dto.isAttendanceOpen) {
      updateData.openedAt = new Date();
      updateData.closedAt = null;
    } else {
      updateData.closedAt = new Date();
    }

    return await AttendanceConfigModel.findOneAndUpdate(
      { sessionId: sessionObjId },
      updateData,
      { new: true, upsert: true },
    );
  }

  static async markAttendance(dto) {
    const sessionObjId = new mongoose.Types.ObjectId(dto.sessionId);
    const userObjId = new mongoose.Types.ObjectId(dto.userId);

    const config = await AttendanceConfigModel.findOne({
      sessionId: sessionObjId,
    });
    if (!config || !config.isAttendanceOpen) {
      throw new Error(
        "Attendance is currently closed or not available for this session.",
      );
    }

    return await AttendanceRecordModel.findOneAndUpdate(
      { sessionId: sessionObjId, userId: userObjId },
      { status: "PRESENT", markedAt: new Date() },
      { new: true, upsert: true, runValidators: true },
    );
  }

  static async getAttendanceReport(sessionId) {
    const session = await WlsSessionModel.findById(sessionId);
    if (!session) throw new Error("Session not found");

    // Fetch present members and POPULATE userId with name and email
    const presentMembers = await AttendanceRecordModel.find({ sessionId })
      .populate("userId", "name email")
      .lean();

    // Collect all assigned user IDs from group assignments
    const assignedUserIds = new Set();
    const groupAssignments = session.groupAssignments;

    if (groupAssignments) {
      const entries =
        groupAssignments instanceof Map
          ? groupAssignments.entries()
          : Object.entries(groupAssignments);

      for (const [groupNum, groupData] of entries) {
        if (Array.isArray(groupData?.userIds)) {
          groupData.userIds.forEach((id) => assignedUserIds.add(id.toString()));
        }
      }
    }

    const presentUserIds = new Set(
      presentMembers.map((m) => {
        // Handle both populated object or raw ObjectId string
        const uId = m.userId?._id || m.userId;
        return uId ? uId.toString() : "";
      }),
    );

    // Identify absent members
    const absentMembers = [];
    for (const uId of assignedUserIds) {
      if (!presentUserIds.has(uId)) {
        absentMembers.push({ userId: uId });
      }
    }

    return {
      sessionId: session._id,
      session: {
        id: session._id,
        title: session.topicName || session.title,
      },
      totalAssigned: assignedUserIds.size,
      totalPresent: presentMembers.length,
      totalAbsent: absentMembers.length,
      presentMembers, // Pass raw populated array to be mapped by AttendanceMapper
      absentMembers,
    };
  }
}

export const attendanceUseCase = AttendanceUseCase;
