// server/src/features/universities/course-progress/courseProgress.usecase.js
import mongoose from "mongoose";
import {
  CourseProgressModel,
  StudentCourseProgressModel,
} from "./courseProgress.model.js";

export class CourseProgressUseCase {
  async updateLectureProgress(
    studentId,
    courseId,
    lectureId,
    watchedMinutes,
    isCompleted,
  ) {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new Error("Invalid course ID provided");
    }

    const course = await CourseProgressModel.findById(courseId);
    if (!course) throw new Error("Course not found");

    // ... rest of your update logic
  }

  async getStudentCourseProgress(studentId, courseId) {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new Error("Invalid course ID provided");
    }

    const course = await CourseProgressModel.findById(courseId).lean();
    if (!course) throw new Error("Course not found");

    let progressDoc = await StudentCourseProgressModel.findOne({
      studentId,
      courseId,
    }).lean();

    return {
      course,
      progress: progressDoc || {
        lectureProgress: [],
        totalCoursePercentage: 0,
      },
    };
  }

  async getSuperUserCourseAudit(courseId) {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new Error("Invalid course ID provided");
    }

    const course = await CourseProgressModel.findById(courseId).lean();
    if (!course) throw new Error("Course not found");

    const studentProgressList = await StudentCourseProgressModel.find({
      courseId,
    })
      .populate("studentId", "name email")
      .lean();

    return {
      courseTitle: course.title,
      language: course.language,
      semester: course.semester,
      totalEnrolledStudents: studentProgressList.length,
      students: studentProgressList.map((sp) => ({
        studentId: sp.studentId?._id,
        name: sp.studentId?.name || "Unknown",
        email: sp.studentId?.email || "N/A",
        rollNumber: sp.rollNumber,
        totalCoursePercentage: sp.totalCoursePercentage,
        lecturesCompletedCount: sp.lectureProgress.filter(
          (lp) => lp.isCompleted,
        ).length,
        lectureProgress: sp.lectureProgress,
      })),
    };
  }
}
