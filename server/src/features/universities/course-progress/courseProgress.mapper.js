// server/src/features/universities/course-progress/courseProgress.mapper.js
import { CourseProgressResponse } from "./courseProgress.res.js";

export class CourseProgressMapper {
  static toResponse(doc) {
    return new CourseProgressResponse(doc);
  }

  static toResponseList(docs) {
    return docs.map((doc) => CourseProgressMapper.toResponse(doc));
  }
}
