import { EnrollmentUseCase } from "./enrollments.usecase.js";
import { CreateEnrollmentRequest } from "./enrollments.req.js";

const useCase = new EnrollmentUseCase();

export class EnrollmentController {
  static async create(req, res, next) {
    try {
      const payload = new CreateEnrollmentRequest(req.body);
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
