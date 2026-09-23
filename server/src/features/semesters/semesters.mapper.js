import { SemesterResponse } from "./semester.res.js";

export class SemesterMapper {
  static toResponse(semester) {
    return new SemesterResponse(semester);
  }
  static toResponseList(semesters) {
    return semesters.map((s) => SemesterMapper.toResponse(s));
  }
}
