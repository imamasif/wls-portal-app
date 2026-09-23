import { UniversityUseCase } from "./university.usecase.js";
import { CreateUniversityRequest } from "./university.req.js";

const useCase = new UniversityUseCase();

export class UniversityController {
  static async create(req, res, next) {
    try {
      const payload = new CreateUniversityRequest(req.body);
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
