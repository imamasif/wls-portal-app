import { BatchUseCase } from "./batch.usecase.js";
import { CreateBatchRequest } from "./batch.req.js";

const useCase = new BatchUseCase();

export class BatchController {
  static async create(req, res, next) {
    try {
      const payload = new CreateBatchRequest(req.body);
      const result = await useCase.create(payload);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getAll(req, res, next) {
    try {
      const result = await useCase.getAll();
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
