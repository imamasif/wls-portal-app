import mongoose from "mongoose";

const semesterSchema = new mongoose.Schema(
  {
    semesterNumber: { type: Number, required: true },
    title: { type: String, required: true },
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const SemesterModel = mongoose.model("Semester", semesterSchema);
