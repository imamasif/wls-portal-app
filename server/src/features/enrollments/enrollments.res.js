export class EnrollmentResponse {
  constructor(enrollment) {
    this.id = enrollment._id;
    this.userId = enrollment.userId;
    this.rollNumber = enrollment.rollNumber;
    this.courseProgress = enrollment.courseProgress;
    this.lessonProgress = enrollment.lessonProgress;
    this.status = enrollment.status;
  }
}
