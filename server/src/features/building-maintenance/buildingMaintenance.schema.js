export const saveDailyReportSchema = {
  type: "object",
  required: ["reportDate"],
  properties: {
    reportDate: { type: "string", minLength: 4 },
    effectiveDate: { type: "string" },
    checkedByGlobal: { type: "string" },
    verifiedBy: { type: "string" },
    generalNotes: { type: "string" },
    status: {
      type: "string",
      enum: ["DRAFT", "IN_PROGRESS", "COMPLETED"],
    },
    items: {
      type: "array",
      items: {
        type: "object",
        required: ["area", "dailyTask"],
        properties: {
          _id: { type: "string" },
          area: { type: "string", minLength: 1 },
          dailyTask: { type: "string", minLength: 1 },
          date: { type: "string" },
          time: { type: "string" },
          checkedBy: { type: "string" },
          status: {
            type: "string",
            enum: ["Pending", "Completed", "Inactive", "PENDING", "COMPLETED", "INACTIVE"],
          },
          initial: { type: "string" },
          dueDate: { type: "string" },
          notes: { type: "string" },
          order: { type: "number" },
        },
        additionalProperties: true,
      },
    },
  },
  additionalProperties: true,
};

export const addAreaSchema = {
  type: "object",
  required: ["area"],
  properties: {
    area: { type: "string", minLength: 2 },
    defaultTask: { type: "string" },
    reportDate: { type: "string" },
  },
  additionalProperties: true,
};

export const renameAreaSchema = {
  type: "object",
  required: ["oldArea", "newArea"],
  properties: {
    oldArea: { type: "string", minLength: 1 },
    newArea: { type: "string", minLength: 1 },
    reportDate: { type: "string" },
  },
  additionalProperties: true,
};

export const addTaskSchema = {
  type: "object",
  required: ["area", "dailyTask"],
  properties: {
    area: { type: "string", minLength: 1 },
    dailyTask: { type: "string", minLength: 2 },
    checkedBy: { type: "string" },
    status: {
      type: "string",
      enum: ["Pending", "Completed", "Inactive", "PENDING", "COMPLETED", "INACTIVE"],
    },
    initial: { type: "string" },
    dueDate: { type: "string" },
    notes: { type: "string" },
    reportDate: { type: "string" },
  },
  additionalProperties: true,
};

export const updateTaskSchema = {
  type: "object",
  properties: {
    area: { type: "string" },
    dailyTask: { type: "string" },
    date: { type: "string" },
    time: { type: "string" },
    checkedBy: { type: "string" },
    status: {
      type: "string",
      enum: ["Pending", "Completed", "Inactive", "PENDING", "COMPLETED", "INACTIVE"],
    },
    initial: { type: "string" },
    dueDate: { type: "string" },
    notes: { type: "string" },
    reportDate: { type: "string" },
  },
  additionalProperties: true,
};
