export class BatchResponse {
  constructor(batch) {
    this.id = batch._id;
    this.universityId = batch.universityId;
    this.admissionYear = batch.admissionYear;
    this.departmentCode = batch.departmentCode;
    this.batchName = batch.batchName;
    this.active = batch.active;
  }
}
