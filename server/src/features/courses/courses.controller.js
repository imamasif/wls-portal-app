import { CourseUseCase } from "./course.usecase.js";
import { CreateCourseRequest } from "./course.req.js";

const useCase = new CourseUseCase();

export class CourseController {
  static async create(req, res, next) {
    try {
      const payload = new CreateCourseRequest(req.body);
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
