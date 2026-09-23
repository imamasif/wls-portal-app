import { SemesterUseCase } from "./semester.usecase.js";
import { CreateSemesterRequest } from "./semester.req.js";

const useCase = new SemesterUseCase();

export class SemesterController {
  static async create(req, res, next) {
    try {
      const payload = new CreateSemesterRequest(req.body);
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
