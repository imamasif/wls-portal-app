export class AttendanceSessionStatusResDTO {
  constructor(config) {
    this.sessionId = config.sessionId;
    this.isAttendanceOpen = config.isAttendanceOpen;
    this.openedAt = config.openedAt;
    this.closedAt = config.closedAt;
  }
}

export class AttendanceStatusResDTO {
  constructor(config) {
    this.sessionId = config.sessionId;
    this.isAttendanceOpen = config.isAttendanceOpen;
    this.openedAt = config.openedAt;
    this.closedAt = config.closedAt;
  }
}

export class AttendanceRecordResDTO {
  constructor(record) {
    this.id = record._id;
    this.sessionId = record.sessionId;
    this.markedAt = record.markedAt;

    // Check if userId was populated into an object or passed separately
    const populatedUser =
      record.userId && typeof record.userId === "object"
        ? record.userId
        : record.user;

    this.userId = populatedUser?._id || record.userId;
    this.user = {
      name: populatedUser?.name || populatedUser?.fullName || "N/A",
      email: populatedUser?.email || "N/A",
    };
  }
}

export class AttendanceReportResDTO {
  constructor(data) {
    this.sessionId = data.sessionId;
    this.totalAssigned = data.totalAssigned;
    this.totalPresent = data.totalPresent;
    this.totalAbsent = data.totalAbsent;
    this.presentMembers = data.presentMembers.map(
      (m) => new AttendanceRecordResDTO(m),
    );
    this.absentMembers = data.absentMembers;
  }
}
