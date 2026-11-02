export const createEventSchema = {
  type: "object",
  required: ["title", "targetAmount", "startDate", "endDate", "description"],
  properties: {
    title: { type: "string", minLength: 2 },
    targetAmount: { type: "number", minimum: 0 },
    currency: { type: "string" },
    startDate: { type: "string" },
    endDate: { type: "string" },
    description: { type: "string", minLength: 2 },
    comments: { type: "string" },
    pictures: {
      type: "array",
      items: { type: "string" },
    },
    status: {
      type: "string",
      enum: ["ACTIVE", "UPCOMING", "COMPLETED", "CANCELLED"],
    },
    createdBy: { type: "string" },
  },
  additionalProperties: true,
};

export const updateEventSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    targetAmount: { type: "number" },
    currency: { type: "string" },
    startDate: { type: "string" },
    endDate: { type: "string" },
    description: { type: "string" },
    comments: { type: "string" },
    pictures: {
      type: "array",
      items: { type: "string" },
    },
    status: {
      type: "string",
      enum: ["ACTIVE", "UPCOMING", "COMPLETED", "CANCELLED"],
    },
  },
  additionalProperties: true,
};

export const createDonationSchema = {
  type: "object",
  required: ["eventId", "pledgeAmount"],
  properties: {
    eventId: { type: "string" },
    userId: { type: "string" },
    donorName: { type: "string" },
    donorEmail: { type: "string" },
    pledgeAmount: { type: "number", minimum: 0 },
    currency: { type: "string" },
    receivedAmount: { type: "number" },
    receivedCurrency: { type: "string" },
    comments: { type: "string" },
    paymentMethod: { type: "string" },
    paymentProofUrl: { type: "string" },
    addedBy: { type: "string" },
  },
  additionalProperties: true,
};

export const updateDonationSchema = {
  type: "object",
  properties: {
    pledgeAmount: { type: "number" },
    currency: { type: "string" },
    receivedAmount: { type: "number" },
    receivedCurrency: { type: "string" },
    status: {
      type: "string",
      enum: [
        "PLEDGED",
        "PARTIALLY_RECEIVED",
        "RECEIVED",
        "OVERPAID",
        "CANCELLED",
      ],
    },
    comments: { type: "string" },
    paymentMethod: { type: "string" },
    paymentProofUrl: { type: "string" },
    receivedDate: { type: "string" },
  },
  additionalProperties: true,
};

export const markPaymentSchema = {
  type: "object",
  required: ["receivedAmount"],
  properties: {
    receivedAmount: { type: "number", minimum: 0 },
    receivedCurrency: { type: "string" },
    receivedDate: { type: "string" },
    paymentProofUrl: { type: "string" },
    comments: { type: "string" },
    status: { type: "string" },
  },
  additionalProperties: true,
};

export const submitProofSchema = {
  type: "object",
  properties: {
    paymentProofUrl: { type: "string" },
    comments: { type: "string" },
  },
  additionalProperties: true,
};
