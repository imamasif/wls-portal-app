import { UniversityResponse } from "./university.res.js";

export class UniversityMapper {
  static toResponse(university) {
    return new UniversityResponse(university);
  }
  static toResponseList(universities) {
    return universities.map((u) => UniversityMapper.toResponse(u));
  }
}
