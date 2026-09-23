import { EnrollmentModel } from "./enrollments.model.js";
import { EnrollmentMapper } from "./enrollments.mapper.js";

export class EnrollmentUseCase {
  async create(data) {
    const enrollment = await EnrollmentModel.create(data);
    return EnrollmentMapper.toResponse(enrollment);
  }
  async getAll() {
    const list = await EnrollmentModel.find({}).populate(
      "userId enrolledCourseId",
    );
    return EnrollmentMapper.toResponseList(list);
  }
}
