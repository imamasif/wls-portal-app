import { BatchResponse } from "./batch.res.js";

export class BatchMapper {
  static toResponse(batch) {
    return new BatchResponse(batch);
  }
  static toResponseList(batches) {
    return batches.map((b) => BatchMapper.toResponse(b));
  }
}
