import mongoose from "mongoose";

const maintenanceTaskItemSchema = new mongoose.Schema(
  {
    area: { type: String, required: true, trim: true },
    dailyTask: { type: String, required: true, trim: true },
    date: { type: String, default: "" }, // e.g. "6/11/26" or "2026-11-06"
    time: { type: String, default: "" },
    checkedBy: { type: String, default: "Yahya" },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Inactive", "PENDING", "COMPLETED", "INACTIVE"],
      default: "Pending",
    },
    initial: { type: String, default: "" },
    dueDate: { type: String, default: "" },
    notes: { type: String, default: "" }, // Notes / Issues / Action Taken notes / Description / Comments
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const buildingMaintenanceSchema = new mongoose.Schema(
  {
    // If true, this is the master template defining unique Areas and Daily Tasks
    isMasterTemplate: { type: Boolean, default: false },

    // Unique normalized report date (e.g. "2026-11-06" or "TEMPLATE")
    reportDate: { type: String, index: true },
    effectiveDate: { type: String, default: "" }, // User-facing display e.g. "6/11/26"

    organization: {
      type: String,
      default: "INTERNATIONAL ISLAMIC PROPAGATION CENTRE CANADA",
    },
    facility: {
      type: String,
      default: "BUILDING MANAGER & MAINTENANCE.",
    },
    address: {
      type: String,
      default: "132 Main Street South, Rockwood, Ontario N0B 2K0",
    },

    checkedByGlobal: { type: String, default: "Yahya" },
    verifiedBy: { type: String, default: "Super Admin" },
    generalNotes: { type: String, default: "" },

    items: [maintenanceTaskItemSchema],

    // Generated exports
    pdfUrl: { type: String, default: null },
    pdfLocalPath: { type: String, default: null },
    googleDriveFileId: { type: String, default: null },
    googleDriveLink: { type: String, default: null },
    googleDriveUploadedAt: { type: Date, default: null },

    status: {
      type: String,
      enum: ["DRAFT", "IN_PROGRESS", "COMPLETED"],
      default: "IN_PROGRESS",
    },

    stats: {
      total: { type: Number, default: 0 },
      completed: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
      inactive: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 },
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  {
    timestamps: true,
    collection: "building_maintenances",
  }
);

// Helper method to compute stats automatically
buildingMaintenanceSchema.methods.calculateStats = function () {
  const items = this.items || [];
  const total = items.length;
  let completed = 0;
  let pending = 0;
  let inactive = 0;

  for (const it of items) {
    const s = (it.status || "").toLowerCase();
    if (s === "completed") completed++;
    else if (s === "inactive") inactive++;
    else pending++;
  }

  const activeTotal = total - inactive;
  const percentage = activeTotal > 0 ? Math.round((completed / activeTotal) * 100) : 0;

  this.stats = { total, completed, pending, inactive, percentage };
  if (completed === total && total > 0) {
    this.status = "COMPLETED";
  }
  return this.stats;
};

export const BuildingMaintenanceModel = mongoose.model(
  "BuildingMaintenance",
  buildingMaintenanceSchema
);
