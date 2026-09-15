export class CreateWlsSessionReqDto {
  constructor(body) {
    this.topicName = body.topicName;
    this.sessionDateTimeToronto = new Date(body.sessionDateTimeToronto);
    this.pdfBookletUrl = body.pdfBookletUrl || '';
    this.quranVideoUrl = body.quranVideoUrl || '';
    this.groupAssignments = body.groupAssignments || {};
  }
}