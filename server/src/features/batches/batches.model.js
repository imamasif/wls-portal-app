import mongoose from "mongoose";

const batchSchema = new mongoose.Schema(
  {
    universityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "University",
      required: true,
    },
    admissionYear: { type: Number, required: true },
    departmentCode: { type: String, required: true, uppercase: true }, // e.g. "CE"
    batchName: { type: String, required: true },
    currentSequenceNumber: { type: Number, default: 12340 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const BatchModel = mongoose.model("Batch", batchSchema);
