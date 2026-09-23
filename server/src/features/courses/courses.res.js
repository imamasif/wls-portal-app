export class CourseResponse {
  constructor(course) {
    this.id = course._id;
    this.title = course.title;
    this.semesterId = course.semesterId;
    this.active = course.active;
  }
}
