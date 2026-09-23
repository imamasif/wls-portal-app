import { SemesterModel } from "./semester.model.js";
import { SemesterMapper } from "./semester.mapper.js";

export class SemesterUseCase {
  async create(data) {
    const semester = await SemesterModel.create(data);
    return SemesterMapper.toResponse(semester);
  }
  async getAll() {
    const list = await SemesterModel.find({}).populate("courses");
    return SemesterMapper.toResponseList(list);
  }
}
