import { BatchModel } from "./batch.model.js";
import { BatchMapper } from "./batch.mapper.js";

export class BatchUseCase {
  async create(data) {
    const batch = await BatchModel.create(data);
    return BatchMapper.toResponse(batch);
  }
  async getAll() {
    const list = await BatchModel.find({});
    return BatchMapper.toResponseList(list);
  }
}
