import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema({
  lectureName: { type: String, required: true },
  durationMinutes: { type: Number, required: true }, // e.g., 150 mins for 2h 30m
  isActive: { type: Boolean, default: true },
  isRequired: { type: Boolean, default: true }, // Mandatory vs Optional
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

export const CourseModel = mongoose.model("Course", courseSchema);
