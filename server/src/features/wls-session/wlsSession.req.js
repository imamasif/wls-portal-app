import { WLS_SESSION_STATUSES } from "../../common/constants/enums.js";

export class CreateWlsSessionReqDto {
  constructor(body, isUpdate = false) {
    this.topicName = body.topicName;
    this.sessionDateTimeToronto = new Date(body.sessionDateTimeToronto);
    this.description = body.description || "";
    this.videoDeadline = body.videoDeadline
      ? new Date(body.videoDeadline)
      : null;
    this.pdfBookletUrls = Array.isArray(body.pdfBookletUrls)
      ? body.pdfBookletUrls
      : [];
    this.quranVideoUrls = Array.isArray(body.quranVideoUrls)
      ? body.quranVideoUrls
      : [];
    this.groupAssignments = body.groupAssignments || {}; // Ensure this maps correctly
    if (body.status) {
      this.status = body.status;
    }
  }
}
