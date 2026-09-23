import { EnrollmentResponse } from "./enrollments.res.js";

export class EnrollmentMapper {
  static toResponse(enrollment) {
    return new EnrollmentResponse(enrollment);
  }
  static toResponseList(enrollments) {
    return enrollments.map((e) => EnrollmentMapper.toResponse(e));
  }
}
