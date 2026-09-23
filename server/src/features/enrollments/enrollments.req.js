export class CreateEnrollmentRequest {
  constructor(body) {
    this.userId = body.userId;
    this.universityId = body.universityId;
    this.batchId = body.batchId;
    this.rollNumber = body.rollNumber;
    this.enrolledCourseId = body.enrolledCourseId;
    this.assignedSemesterId = body.assignedSemesterId;
  }
}
