export class BuildingMaintenanceResDTO {
  constructor(doc) {
    this.id = doc._id ? doc._id.toString() : doc.id;
    this._id = this.id;
    this.isMasterTemplate = Boolean(doc.isMasterTemplate);
    this.reportDate = doc.reportDate || "";
    this.effectiveDate = doc.effectiveDate || "";
    this.organization = doc.organization || "INTERNATIONAL ISLAMIC PROPAGATION CENTRE CANADA";
    this.facility = doc.facility || "BUILDING MANAGER & MAINTENANCE.";
    this.address = doc.address || "132 Main Street South, Rockwood, Ontario N0B 2K0";

    this.checkedByGlobal = doc.checkedByGlobal || "Yahya";
    this.verifiedBy = doc.verifiedBy || "Super Admin";
    this.generalNotes = doc.generalNotes || "";

    this.items = Array.isArray(doc.items)
      ? doc.items.map((it) => ({
          _id: it._id ? it._id.toString() : undefined,
          id: it._id ? it._id.toString() : undefined,
          area: it.area || "General",
          dailyTask: it.dailyTask || "",
          date: it.date || doc.effectiveDate || doc.reportDate || "",
          time: it.time || "",
          checkedBy: it.checkedBy || doc.checkedByGlobal || "Yahya",
          status: it.status || "Pending",
          initial: it.initial || "",
          dueDate: it.dueDate || "",
          notes: it.notes || "",
          order: typeof it.order === "number" ? it.order : 0,
        }))
      : [];

    this.pdfUrl = doc.pdfUrl || null;
    this.googleDriveFileId = doc.googleDriveFileId || null;
    this.googleDriveLink = doc.googleDriveLink || null;
    this.googleDriveUploadedAt = doc.googleDriveUploadedAt || null;

    this.status = doc.status || "IN_PROGRESS";
    this.stats = doc.stats || {
      total: this.items.length,
      completed: this.items.filter((i) => (i.status || "").toLowerCase() === "completed").length,
      pending: this.items.filter((i) => (i.status || "").toLowerCase() === "pending").length,
      inactive: this.items.filter((i) => (i.status || "").toLowerCase() === "inactive").length,
      percentage: 0,
    };

    this.createdAt = doc.createdAt;
    this.updatedAt = doc.updatedAt;
  }
}

export class BuildingMaintenanceDateListResDTO {
  constructor(doc) {
    this.id = doc._id ? doc._id.toString() : doc.id;
    this._id = this.id;
    this.reportDate = doc.reportDate || "";
    this.effectiveDate = doc.effectiveDate || "";
    this.checkedByGlobal = doc.checkedByGlobal || "Yahya";
    this.status = doc.status || "IN_PROGRESS";
    this.stats = doc.stats || {
      total: (doc.items || []).length,
      completed: 0,
      pending: 0,
      inactive: 0,
      percentage: 0,
    };
    this.pdfUrl = doc.pdfUrl || null;
    this.googleDriveLink = doc.googleDriveLink || null;
    this.updatedAt = doc.updatedAt;
  }
}
