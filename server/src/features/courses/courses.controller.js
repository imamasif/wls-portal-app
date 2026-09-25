// server/src/features/courses/course.controller.js
import { CourseUseCase } from "./courses.usecase.js";
import { CreateCourseRequest } from "./courses.req.js";

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

  static async addLectureToCourse(req, res, next) {
    try {
      const { courseId } = req.params;
      const { topicName, lectureName, durationMinutes, isActive, isRequired } =
        req.body;
      const result = await useCase.addTopicOrLecture(courseId, topicName, {
        lectureName,
        durationMinutes,
        isActive,
        isRequired,
      });
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async deleteLecture(req, res, next) {
    try {
      const { courseId, lectureId } = req.params;
      const result = await useCase.removeLecture(courseId, lectureId);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
