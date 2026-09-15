export class WlsSessionResDto {
  constructor(doc) {
    this.id = doc._id;
    this.topicName = doc.topicName;
    this.sessionDateTimeToronto = doc.sessionDateTimeToronto;
    this.description = doc.description || '';
    this.videoDeadline = doc.videoDeadline || null;
    this.pdfBookletUrls = doc.pdfBookletUrls || [];
    this.quranVideoUrls = doc.quranVideoUrls || [];
    this.groupAssignments = doc.groupAssignments || {};
    this.status = doc.status;
    this.cancelReason = doc.cancelReason;
    this.createdAt = doc.createdAt;
  }
}