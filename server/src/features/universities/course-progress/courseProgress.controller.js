// server/src/features/universities/course-progress/courseProgress.controller.js
import { CourseProgressUseCase } from "./courseProgress.usecase.js";

const courseProgressUseCase = new CourseProgressUseCase();

export class CourseProgressController {
  static async updateProgress(req, res, next) {
    try {
      const { studentId, courseId, lectureId, watchedMinutes, isCompleted } =
        req.body;
      const result = await courseProgressUseCase.updateLectureProgress(
        studentId,
        courseId,
        lectureId,
        watchedMinutes,
        isCompleted,
      );
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getStudentView(req, res, next) {
    try {
      const { studentId, courseId } = req.params;
      const result = await courseProgressUseCase.getStudentCourseProgress(
        studentId,
        courseId,
      );
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getSuperUserAudit(req, res, next) {
    try {
      const { courseId } = req.params;
      const result =
        await courseProgressUseCase.getSuperUserCourseAudit(courseId);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
