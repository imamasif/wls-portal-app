export class CreateBatchRequest {
  constructor(body) {
    this.universityId = body.universityId;
    this.admissionYear = body.admissionYear;
    this.departmentCode = body.departmentCode.toUpperCase();
    this.batchName = body.batchName;
    this.currentSequenceNumber = body.currentSequenceNumber || 12340;
  }
}
