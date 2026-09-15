export class WlsSessionResDto {
  constructor(doc) {
    this.id = doc._id;
    this.topicName = doc.topicName;
    this.sessionDateTimeToronto = doc.sessionDateTimeToronto;
    this.pdfBookletUrl = doc.pdfBookletUrl;
    this.quranVideoUrl = doc.quranVideoUrl;
    this.groupAssignments = doc.groupAssignments;
    this.status = doc.status;
    this.cancelReason = doc.cancelReason;
    this.createdAt = doc.createdAt;
  }
}