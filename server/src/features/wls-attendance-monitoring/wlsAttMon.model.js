import mongoose from "mongoose";

// Tracks individual user attendance records per session
const AttendanceRecordSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["PRESENT", "ABSENT", "LATE"],
      default: "PRESENT",
    },
    markedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

AttendanceRecordSchema.index({ sessionId: 1, userId: 1 }, { unique: true });

// Tracks session-wide attendance control (open/closed status)
const AttendanceConfigSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      unique: true,
    },
    isAttendanceOpen: { type: Boolean, default: false },
    openedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
    openedBy: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

export const AttendanceRecordModel = mongoose.model(
  "WlsAttendanceRecord",
  AttendanceRecordSchema,
);
export const AttendanceConfigModel = mongoose.model(
  "WlsAttendanceConfig",
  AttendanceConfigSchema,
);
