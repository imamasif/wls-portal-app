export class SaveDailyReportReqDTO {
  constructor({
    reportDate,
    effectiveDate = "",
    checkedByGlobal = "Yahya",
    verifiedBy = "Super Admin",
    generalNotes = "",
    status = "IN_PROGRESS",
    items = [],
  }) {
    this.reportDate = (reportDate || "").trim();
    this.effectiveDate = (effectiveDate || "").trim();
    this.checkedByGlobal = (checkedByGlobal || "Yahya").trim();
    this.verifiedBy = (verifiedBy || "Super Admin").trim();
    this.generalNotes = (generalNotes || "").trim();
    this.status = status || "IN_PROGRESS";
    this.items = Array.isArray(items)
      ? items.map((it, idx) => ({
          _id: it._id || undefined,
          area: (it.area || "General").trim(),
          dailyTask: (it.dailyTask || "").trim(),
          date: (it.date || this.effectiveDate || this.reportDate).trim(),
          time: (it.time || "").trim(),
          checkedBy: (it.checkedBy || this.checkedByGlobal || "Yahya").trim(),
          status: it.status || "Pending",
          initial: (it.initial || "").trim(),
          dueDate: (it.dueDate || "").trim(),
          notes: (it.notes || "").trim(),
          order: typeof it.order === "number" ? it.order : idx,
        }))
      : [];
  }
}

export class AddAreaReqDTO {
  constructor({ area, defaultTask = "", reportDate = "" }) {
    this.area = (area || "").trim();
    this.defaultTask = (defaultTask || "").trim();
    this.reportDate = (reportDate || "").trim();
  }
}

export class RenameAreaReqDTO {
  constructor({ oldArea, newArea, reportDate = "" }) {
    this.oldArea = (oldArea || "").trim();
    this.newArea = (newArea || "").trim();
    this.reportDate = (reportDate || "").trim();
  }
}

export class AddTaskReqDTO {
  constructor({
    area,
    dailyTask,
    checkedBy = "Yahya",
    status = "Pending",
    initial = "",
    dueDate = "",
    notes = "",
    reportDate = "",
  }) {
    this.area = (area || "").trim();
    this.dailyTask = (dailyTask || "").trim();
    this.checkedBy = (checkedBy || "Yahya").trim();
    this.status = status || "Pending";
    this.initial = (initial || "").trim();
    this.dueDate = (dueDate || "").trim();
    this.notes = (notes || "").trim();
    this.reportDate = (reportDate || "").trim();
  }
}

export class UpdateTaskReqDTO {
  constructor(data) {
    if (data.area !== undefined) this.area = data.area.trim();
    if (data.dailyTask !== undefined) this.dailyTask = data.dailyTask.trim();
    if (data.date !== undefined) this.date = data.date.trim();
    if (data.time !== undefined) this.time = data.time.trim();
    if (data.checkedBy !== undefined) this.checkedBy = data.checkedBy.trim();
    if (data.status !== undefined) this.status = data.status;
    if (data.initial !== undefined) this.initial = data.initial.trim();
    if (data.dueDate !== undefined) this.dueDate = data.dueDate.trim();
    if (data.notes !== undefined) this.notes = data.notes.trim();
    if (data.reportDate !== undefined) this.reportDate = data.reportDate.trim();
  }
}
