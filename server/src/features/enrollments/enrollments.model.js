import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    universityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "University",
      required: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },
    rollNumber: { type: String, required: true, unique: true }, // Format: YYYY-DEPT-ROLLNUMBER
    enrolledCourseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    assignedSemesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
      required: true,
    },
    courseProgress: { type: String, default: "0%" },
    lessonProgress: { type: String, default: "0/83" },
    status: {
      type: String,
      enum: ["ACTIVE", "COMPLETED", "SUSPENDED"],
      default: "ACTIVE",
    },
    topicProgressDetails: [
      {
        topicId: String,
        subTopicId: String,
        isActive: { type: Boolean, default: true },
        isRequired: { type: Boolean, default: true },
        isCompleted: { type: Boolean, default: false },
        totalVideoDurationMinutes: Number,
        viewedDurationMinutes: Number,
      },
    ],
  },
  { timestamps: true },
);

export const EnrollmentModel = mongoose.model(
  "StudentEnrollment",
  enrollmentSchema,
);
