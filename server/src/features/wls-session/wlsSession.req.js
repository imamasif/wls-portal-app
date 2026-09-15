export class CreateWlsSessionReqDto {
  constructor(body) {
    this.topicName = body.topicName;
    this.sessionDateTimeToronto = new Date(body.sessionDateTimeToronto);
    this.description = body.description || '';
    this.videoDeadline = body.videoDeadline ? new Date(body.videoDeadline) : null;
    this.pdfBookletUrls = Array.isArray(body.pdfBookletUrls) ? body.pdfBookletUrls : [];
    this.quranVideoUrls = Array.isArray(body.quranVideoUrls) ? body.quranVideoUrls : [];
    this.groupAssignments = body.groupAssignments || {};
  }
}