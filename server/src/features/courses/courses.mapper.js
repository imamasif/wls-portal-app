import { CourseResponse } from "./course.res.js";

export class CourseMapper {
  static toResponse(course) {
    return new CourseResponse(course);
  }
  static toResponseList(courses) {
    return courses.map((c) => CourseMapper.toResponse(c));
  }
}
