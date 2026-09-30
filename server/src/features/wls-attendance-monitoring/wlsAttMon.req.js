export class ToggleAttendanceReqDTO {
  constructor({ sessionId, isAttendanceOpen, adminId }) {
    this.sessionId = sessionId;
    this.isAttendanceOpen = isAttendanceOpen;
    this.adminId = adminId;
  }
}

export class MarkAttendanceReqDTO {
  constructor({ sessionId, userId }) {
    this.sessionId = sessionId;
    this.userId = userId;
  }
}
