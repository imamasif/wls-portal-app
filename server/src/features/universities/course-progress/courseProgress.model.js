// server/src/features/universities/course-progress/courseProgress.model.js
import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema({
  lectureName: { type: String, required: true },
  durationMinutes: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  isRequired: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
});

const topicSchema = new mongoose.Schema({
  topicName: { type: String, required: true },
  order: { type: Number, default: 0 },
  lectures: [lectureSchema],
});

const courseSchema = new mongoose.Schema(
  {
    universityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "University",
      required: true,
    },
    title: { type: String, required: true },
    code: { type: String, required: true },
    language: { type: String, enum: ["URDU", "ENGLISH"], default: "URDU" },
    semester: { type: String, required: true },
    topics: [topicSchema],
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const lectureProgressSchema = new mongoose.Schema({
  lectureId: { type: mongoose.Schema.Types.ObjectId, required: true },
  watchedMinutes: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false },
  lastUpdated: { type: Date, default: Date.now },
});

const studentCourseProgressSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    rollNumber: { type: String, required: true },
    lectureProgress: [lectureProgressSchema],
    totalCoursePercentage: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Safe model export checking existing compiled models to prevent OverwriteModelError
export const CourseProgressModel =
  mongoose.models.Course || mongoose.model("Course", courseSchema);

export const StudentCourseProgressModel =
  mongoose.models.StudentCourseProgress ||
  mongoose.model("StudentCourseProgress", studentCourseProgressSchema);
