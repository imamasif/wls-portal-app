import { UniversityModel } from "./university.model.js";
import { UniversityMapper } from "./university.mapper.js";

export class UniversityUseCase {
  async create(data) {
    const university = await UniversityModel.create(data);
    return UniversityMapper.toResponse(university);
  }

  async getAll() {
    const list = await UniversityModel.find({});
    return UniversityMapper.toResponseList(list);
  }
}
