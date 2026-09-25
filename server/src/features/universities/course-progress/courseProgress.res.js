// server/src/features/universities/course-progress/courseProgress.res.js
export class CourseProgressResponse {
  constructor(doc) {
    this.id = doc._id;
    this.studentId = doc.studentId;
    this.courseId = doc.courseId;
    this.rollNumber = doc.rollNumber;
    this.lectureProgress = doc.lectureProgress || [];
    this.totalCoursePercentage = doc.totalCoursePercentage || 0;
    this.updatedAt = doc.updatedAt;
  }
}
