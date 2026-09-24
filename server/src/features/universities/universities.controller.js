import { UniversityModel } from "./universities.model.js";
import { BatchModel } from "../batches/batches.model.js";
import { EnrollmentModel } from "../enrollments/enrollments.model.js";
import { CourseModel } from "../courses/courses.model.js";
// Import SemesterModel so Mongoose recognizes it during populate
import { SemesterModel } from "../semesters/semesters.model.js"; // Adjust path if your semesters model is located elsewhere

export class UniversityController {
  static async getUniversitySummary(req, res, next) {
    try {
      const university = await UniversityModel.findOne({ active: true });
      if (!university) {
        return res.status(404).json({
          success: false,
          message: "University configuration not found",
        });
      }

      const batches = await BatchModel.find({ universityId: university._id });
      const courses = await CourseModel.find({ active: true });

      const enrollments = await EnrollmentModel.find({
        universityId: university._id,
      })
        .populate("userId", "name email role")
        .populate("enrolledCourseId", "title")
        .populate("assignedSemesterId", "title semesterNumber");

      const courseStats = courses.map((course) => {
        const enrolledStudents = enrollments.filter((e) =>
          e.enrolledCourseId?._id.equals(course._id),
        );
        return {
          courseId: course._id,
          title: course.title,
          totalRegistered: enrolledStudents.length,
          activeCount: enrolledStudents.filter((e) => e.status === "ACTIVE")
            .length,
          students: enrolledStudents.map((e) => ({
            enrollmentId: e._id,
            name: e.userId?.name || "Unknown",
            email: e.userId?.email || "N/A",
            rollNumber: e.rollNumber,
            courseProgress: e.courseProgress,
            lessonProgress: e.lessonProgress,
            status: e.status,
          })),
        };
      });

      res.status(200).json({
        success: true,
        data: {
          university,
          batches,
          totalBatches: batches.length,
          totalEnrollments: enrollments.length,
          courseBreakdown: courseStats,
          allEnrollments: enrollments.map((e) => ({
            id: e._id,
            name: e.userId?.name,
            email: e.userId?.email,
            rollNumber: e.rollNumber,
            course: e.enrolledCourseId?.title,
            courseProgress: e.courseProgress,
            lessonProgress: e.lessonProgress,
            status: e.status,
          })),
        },
      });
    } catch (err) {
      next(err);
    }
  }
}
