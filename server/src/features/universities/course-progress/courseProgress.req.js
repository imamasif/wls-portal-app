// server/src/features/universities/course-progress/courseProgress.req.js
export class CourseProgressRequest {
  constructor(body) {
    this.studentId = body.studentId;
    this.courseId = body.courseId;
    this.lectureId = body.lectureId;
    this.watchedMinutes = body.watchedMinutes ?? 0;
    this.isCompleted = body.isCompleted ?? false;
  }
}
