import { CourseModel } from "./course.model.js";
import { CourseMapper } from "./course.mapper.js";

export class CourseUseCase {
  async create(data) {
    const course = await CourseModel.create(data);
    return CourseMapper.toResponse(course);
  }
  async getAll() {
    const list = await CourseModel.find({});
    return CourseMapper.toResponseList(list);
  }
}
