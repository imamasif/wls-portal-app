import {
  ToggleAttendanceReqDTO,
  MarkAttendanceReqDTO,
} from "./wlsAttMon.req.js";
import {
  AttendanceRecordResDTO,
  AttendanceSessionStatusResDTO,
} from "./wlsAttMon.res.js";

export class AttendanceMapper {
  static toToggleReqDTO(body) {
    return new ToggleAttendanceReqDTO(body);
  }

  static toMarkReqDTO(body) {
    return new MarkAttendanceReqDTO(body);
  }

  static toRecordResDTO(doc) {
    if (!doc) return null;
    const docObj = doc.toObject ? doc.toObject() : doc;
    return new AttendanceRecordResDTO(docObj);
  }

  static toRecordResDTOList(entities) {
    return entities.map((entity) => this.toRecordResDTO(entity));
  }

  static toSessionStatusResDTO(configDoc, sessionDoc) {
    return new AttendanceSessionStatusResDTO(configDoc, sessionDoc);
  }
}
