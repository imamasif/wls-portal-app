import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true },
    semesterId: { type: mongoose.Schema.Types.ObjectId, ref: "Semester" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const CourseModel = mongoose.model("Course", courseSchema);
