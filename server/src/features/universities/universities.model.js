import mongoose from "mongoose";

const universitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      default: "WLS Global Islamic & Technical University",
    },
    code: { type: String, required: true, unique: true, uppercase: true },
    foundedYear: { type: Number, default: 2026 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const UniversityModel = mongoose.model("University", universitySchema);
